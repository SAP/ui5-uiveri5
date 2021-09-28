const request = require("request");
const uuid = require("uuid");

const status = {
  running: "running",
  success: "successful",
  failed: "failed"
};

// constructor
function DwcReporter(config,instanceConfig,logger,collector) {
  this.config = config || {};
  this.instanceConfig  = instanceConfig || {};
  this.logger = logger;
  this.collector = collector;
  this.options = {
    stdout: true,
    syncInterval: 100,
    retries: 5,
    themistoUrl: instanceConfig.themistoUrl,
    themistoCredentials: `Basic ${Buffer.from(`${instanceConfig.themistoUser}:${instanceConfig.themistoPass}`).toString("base64")}`,
    vector: instanceConfig.vector
  };
}

// upload to Themisto
DwcReporter.prototype._postMetadata = function(url, credentials, vectorId, value) {
  return new Promise((resolve,reject) => {
    request({
      url: url + "/v1/vector/" + encodeURIComponent(vectorId) + "/metadata?key=tests",
      method: "POST",
      headers: {
        "Authorization": credentials
      },
      json: true,
      body: value
    }, function (err, response, body) {
      if (!err) {
        if (response.statusCode === 200) {
          return resolve(body);
        } else {
          if (body) return reject(body);
        }
      }
      
      return reject(err);
    });
  });
};

// get vector details
DwcReporter.prototype._getVector = function(url, credentials, vectorId) {
  return new Promise((resolve,reject) => {
    request({
      url: url + "/v1/vector/" + encodeURIComponent(vectorId),
      method: "GET",
      headers: {
        "Authorization": credentials
      },
    }, function (err, response, body) {
      if (!err) {
        if (response.statusCode === 200) {
          try {
            return resolve(JSON.parse(body));
          } catch (error) {
            return reject(error);
          }
        } else {
          if (body) return reject(body);
        }
      }

      return reject(err);
    });
  });
};

// update data in Themisto
DwcReporter.prototype._patchMetadata = function(url, credentials, vectorId, value) {
  return new Promise((resolve,reject) => {
    request({
      url: url + "/v1/vector/" + encodeURIComponent(vectorId) + "/metadata/tests",
      method: "PATCH",
      headers: {
        "Authorization": credentials
      },
      json: true,
      body: value
    }, function (err, response, body) {
      if (!err) {
        if (response.statusCode === 200) {
          return resolve(body);
        } else {
          if (body) return reject(body);
        }
      }

      return reject(err);
    });
  });
};

// retry upload data due to locking mechanism
DwcReporter.prototype._retryRequest = function(requestFn, body, nTimes) {
  return new Promise((resolve, reject) => {
    const vectorId = this.options.vector;
    const creds = this.options.themistoCredentials;
    const url = this.options.themistoUrl;
    let attempts = 1, result;

    const retry = async (requestFn, body, nTimes) => {
      try {
        result = await requestFn(url, creds, vectorId, body);
        return resolve(result);
      } catch (e) {
        if (nTimes === 1) {
          if (this.retryTimer) {
            clearTimeout(this.retryTimer);
          }

          return reject(e);
        } else {
          this.retryTimer = setTimeout(() => {
            attempts++;
            retry(requestFn, body, nTimes - 1);
          }, attempts * 500);
        }
      }
    };

    return retry(requestFn, body, nTimes);
  });
};

DwcReporter.prototype._sync = async function(results) {
  let vector, err;
  try {
    vector = await this._getVector(this.options.themistoUrl, this.options.themistoCredentials, this.options.vector);
  } catch (e) {
    err = e;
    this.logger.error("Could not report test results for test: " + results.baseInformation.name + ". Could not get Vector. Error occurred: " + JSON.stringify(err));
    results.error = true;

    return err;
  }

  const isMetadataAvailable = vector && vector.metadata && vector.metadata.tests;
  const report = results.reportTestRun;
  let patchBody, result;

  if (results.index < 0) {
    patchBody = [{op: "add", path: "/-", value: report}];
  } else {
    patchBody = [{op: "replace", path: `/${results.index}`, value: report}];
  }

  if (!isMetadataAvailable) {
    try {
      result = await this._retryRequest(this._postMetadata, [report], 1);
    } catch (e) {
      err = e;

      if (err.status === 400 || err.status === 500) {
        try {
          result = await this._retryRequest(this._patchMetadata, patchBody, this.options.retries);
        } catch (e) {
          err = e;
          results.error = true;
          this.logger.error("Could not report test results for test: " + results.baseInformation.name + ". Patch Metadata failed. Error occurred: " + JSON.stringify(err));
        }
      } else {
        this.logger.error("Could not report test results for test: " + results.baseInformation.name + ". Post Metadata failed. Error occurred: " + JSON.stringify(err));
        results.error = true;
      }
    }
  } else {
    try {
      result = await this._retryRequest(this._patchMetadata, patchBody, this.options.retries);
    } catch (e) {
      err = e;
      this.logger.error("Could not report test results for test: " + results.baseInformation.name + ". Patch Metadata failed. Error occurred: " + JSON.stringify(err));
      results.error = true;
    }
  }

  if (!results.error && results.index < 0) {
    results.index = result && Array.isArray(result) ? result.findIndex(test => { return test.id === results.baseInformation.id; }) : 0;
  }

  results.reportTestRun = {};
  return err || null;
};

DwcReporter.prototype._asyncSuiteStarted = async function(suiteInfo){
    
  this.results = {};
  this.results.passed = true;

  this.results.index = -1;
  this.results.error = false;
  this.results.baseInformation = {};
  this.results.reportTestRun = {};

  if (!this.options.themistoUrl || typeof this.options.themistoUrl !== "string" || !this.options.themistoCredentials || !this.options.vector) {
    this.logger.error("DwC reporter is missing required environment variables. Results will not be reported.\n");
    this.results.error = true;
  }

  this.results.baseInformation = {
    id: uuid.v4(),
    name: suiteInfo.fullName,
    type: "UiVeri5",
    link: "saucelabs_link",//TODO: optional saucelabs link? 
    timestamp: new Date().toISOString(),
    reporter: "UiVeri5 DwC Reporter"
  };
  
  if (this.collector && this.collector.overview && this.collector.overview.meta && this.collector.overview.meta.runtime) {
    this.results.baseInformation.desiredCapabilities = {};

    this.results.baseInformation.desiredCapabilities.browserName = this.collector.overview.meta.runtime.browserName;
    this.results.baseInformation.desiredCapabilities.browserVersion = this.collector.overview.meta.runtime.browserVersion;
    this.results.baseInformation.desiredCapabilities.platform = this.collector.overview.meta.runtime.platformName;
    this.results.baseInformation.desiredCapabilities.screenResolution = this.collector.overview.meta.runtime.platformResolution;
  }

  if (this.instanceConfig.stage) {
    this.results.baseInformation.executedOnStage = this.instanceConfig.stage;
  }

  if (this.instanceConfig.gitHubRepoName) {
    this.results.baseInformation.githubRepo = this.instanceConfig.gitHubRepoName;
  }

  if (this.instanceConfig.gitHubRepoUrl) {
    this.results.baseInformation.githubRepoUrl = this.instanceConfig.gitHubRepoUrl;
  }

  // jenkins, azure or other build url
  if (process.env.BUILD_URL) {
    this.results.baseInformation.buildLink = process.env.BUILD_URL;
  }

  this.results.reportTestRun = this.results.baseInformation;
  this.results.reportTestRun.status = status.running;
  
  await this._sync(this.results);
};

DwcReporter.prototype.jasmineStarted = function() {
  var that = this;
  this.results = {};
  this.suiteInfo = {};

  afterAll(async function() {
    that.results.passed = that.collector.currentSuite.status == "passed"
    const report = that.results.baseInformation;

    if (that.results.passed) {
      report.status = status.success;
    } else {
      report.status = status.failed;
    }

    that.results.reportTestRun = report;
    await that._sync(that.results); 
  });
}

DwcReporter.prototype.suiteStarted = async function(result){
  // var that = this;
  this.suiteInfo = {};

  this.suiteInfo = result;
  await this._asyncSuiteStarted(this.suiteInfo);
};

DwcReporter.prototype.register = function(jasmineEnv) {
  // create and attach the JUnit reporter
  jasmineEnv.addReporter(new DwcReporter(this.config,this.instanceConfig,this.logger,this.collector));
};

module.exports = function(config,instanceConfig,logger,collector){
  return new DwcReporter(config,instanceConfig,logger,collector);
};