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
    themistoUrl: process.env.THEMISTO_URL,
    themistoCredentials: `Basic ${Buffer.from(`${process.env.THEMISTO_USER}:${process.env.THEMISTO_PASS}`).toString("base64")}`,
    vector: process.env.VECTOR
  };
}

// upload to Themisto
DwcReporter.prototype.postMetadata = function(url, credentials, vectorId, value) {
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
DwcReporter.prototype.getVector = function(url, credentials, vectorId) {
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
DwcReporter.prototype.patchMetadata = function(url, credentials, vectorId, value) {
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
DwcReporter.prototype.retryRequest = function(requestFn, body, nTimes) {
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
          if (this.retryTimer) clearTimeout(this.retryTimer);
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

DwcReporter.prototype.sync = async function(instance) {
  let vector, err;
  try {
    vector = await this.getVector(this.options.themistoUrl, this.options.themistoCredentials, this.options.vector);
  } catch (e) {
    err = e;
    console.log(`Could not report test results for test: ${instance.baseInformation.name}. Could not get Vector. Error occurred: ${JSON.stringify(err)}\n`);
    instance.error = true;

    return err;
  }

  const isMetadataAvailable = vector && vector.metadata && vector.metadata.tests;
  const report = instance.reportTestRun;
  let patchBody, result;

  if (instance.index < 0) {
    patchBody = [{op: "add", path: "/-", value: report}];
  } else {
    patchBody = [{op: "replace", path: `/${instance.index}`, value: report}];
  }

  if (!isMetadataAvailable) {
    try {
      result = await this.retryRequest(this.postMetadata, [report], 1);
    } catch (e) {
      err = e;

      if (err.status === 400 || err.status === 500) {
        try {
          result = await this.retryRequest(this.patchMetadata, patchBody, this.options.retries);
        } catch (e) {
          err = e;
          instance.error = true;
          console.log(`Could not report test results for test ${instance.baseInformation.name}. Patch Metadata failed. Error occurred: ${JSON.stringify(err)}\n`);
        }
      } else {
        console.log(`Could not report test results for test ${instance.baseInformation.name}. Post Metadata failed. Error occurred: ${JSON.stringify(err)}\n`);
        instance.error = true;
      }
    }
  } else {
    try {
      result = await this.retryRequest(this.patchMetadata, patchBody, this.options.retries);
    } catch (e) {
      err = e;
      console.log(`Could not report test results for test ${instance.baseInformation.name}. Patch Metadata failed. Error occurred: ${JSON.stringify(err)}\n`);
      instance.error = true;
    }
  }

  if (!instance.error && instance.index < 0) {
    instance.index = result && Array.isArray(result) ? result.findIndex(test => { return test.id === instance.baseInformation.id; }) : 0;
  }

  instance.reportTestRun = {};
  return err || null;
};

DwcReporter.prototype._asyncSuiteStarted = async function(suiteInfo, sessionId, browser){
    
  this.instance[sessionId] = {};
  this.instance[sessionId].passed = true;
  this.instance[sessionId].stateCounts = {
    passed: 0,
    failed: 0,
    disabled: 0,
    pending: 0
  };

  this.instance[sessionId].index = -1;
  this.instance[sessionId].error = false;
  this.instance[sessionId].baseInformation = {};
  this.instance[sessionId].reportTestRun = {};

  if (!this.options.themistoUrl || typeof this.options.themistoUrl !== "string" || !this.options.themistoCredentials || !this.options.vector) {
    console.log("DwC reporter is missing required environment variables. Results will not be reported.\n");
    this.instance[sessionId].error = true;
  }

  // let config = await browser.getProcessedConfig();

  this.instance[sessionId].baseInformation = {
    id: uuid.v4(),
    name: suiteInfo.fullName,
    type: "UiVeri5",
    link: "saucelabs_link",//TODO: optional saucelabs link? 
    timestamp: new Date().toISOString(),
    reporter: "UiVeri5 DwC Reporter"
  };
  
  if (this.collector && this.collector.overview && this.collector.overview.meta && this.collector.overview.meta.runtime) {
    this.instance[sessionId].baseInformation.desiredCapabilities = {};

    this.instance[sessionId].baseInformation.desiredCapabilities.browserName = this.collector.overview.meta.runtime.browserName;
    this.instance[sessionId].baseInformation.desiredCapabilities.browserVersion = this.collector.overview.meta.runtime.browserVersion;
    this.instance[sessionId].baseInformation.desiredCapabilities.platform = this.collector.overview.meta.runtime.platformName;
    this.instance[sessionId].baseInformation.desiredCapabilities.screenResolution = this.collector.overview.meta.runtime.platformResolution;
  }

  if (process.env.STAGE) {
    this.instance[sessionId].baseInformation.executedOnStage = process.env.STAGE;
  }

  if (process.env.GITHUB_REPO_NAME) {
    this.instance[sessionId].baseInformation.githubRepo = process.env.GITHUB_REPO_NAME;
  }

  if (process.env.GITHUB_REPO_URL) {
    this.instance[sessionId].baseInformation.githubRepoUrl = process.env.GITHUB_REPO_URL;
  }

  if (process.env.BUILD_URL) {
    this.instance[sessionId].baseInformation.buildLink = process.env.BUILD_URL;
  }

  this.instance[sessionId].reportTestRun = this.instance[sessionId].baseInformation;
  this.instance[sessionId].reportTestRun.status = status.running;
  
  await this.sync(this.instance[sessionId]);
};

DwcReporter.prototype._asyncSuiteFinished = async function(instance){
  if (instance.stateCounts.failed > 0) instance.passed = false;
  const report = instance.baseInformation;

  if (instance.passed) {
    report.status = status.success;
  } else {
    report.status = status.failed;
  }

  instance.reportTestRun = report;
  await this.sync(instance);
};

DwcReporter.prototype.jasmineStarted = function() {
  var that = this;
  this.instance = {};
  this.suiteInfo = {};
  this.suiteInfOneTime = {};
  this.suitePrevSession={};

  beforeEach(async function() { 
    var session = await browser.driver.getSession();
    const sessionId = session.getId();
    if (that.suitePrevSession && that.suitePrevSession.sessionId) {
      await that._asyncSuiteFinished(that.suitePrevSession.instance);
      that.suitePrevSession.sessionId = null;
    }
    if (!that.suiteInfOneTime[sessionId]) {
      await that._asyncSuiteStarted(that.suiteInfo, sessionId, browser);
      that.suiteInfOneTime[sessionId] = true;
      that.suitePrevSession.sessionId = null; 
    }
  });

  afterAll(async function() {
    var session = await browser.driver.getSession();
    const sessionId = session.getId();
    await that._asyncSuiteFinished(that.instance[sessionId]);
    that.suiteInfOneTime[sessionId] = true;       
  });

  jasmine.getEnv().addReporter(new function () {
    this.suiteStarted = async function(result){
      var session = await browser.driver.getSession();
      const sessionId = session.getId();
      that.suiteInfo = result;
      that.suiteInfOneTime[sessionId] = false; 
    };

    this.specDone = async function (result) {
      var session = await browser.driver.getSession();
      const sessionId = session.getId();

      switch (result.status) {
        case "disabled":
          that.instance[sessionId].stateCounts.disabled++;    
          break;
        case "passed":
          that.instance[sessionId].stateCounts.passed++;    
          break;
        case "pending":
            that.instance[sessionId].stateCounts.pending++;    
            break;
        case "failed":
          that.instance[sessionId].passed = false;
          that.instance[sessionId].stateCounts.failed++;   
          break;
        default:
          throw new Error("Status could not be specified: " + result.status);
      }

      var failedLength = result.failedExpectations;

      if (failedLength && failedLength.length > 0) {
        for (var i = 0; i < failedLength.length; i++) {
          console.log("Failure: " + result.failedExpectations[i].message);
          console.log(result.failedExpectations[i].stack);
        }
          
      }
    };

    this.suiteDone =async function(){
      var session = await browser.driver.getSession();
      const sessionId = session.getId();
      that.suitePrevSession = {};
      that.suitePrevSession.sessionId = sessionId;
      that.suitePrevSession.instance = that.instance[sessionId];
    };
  });
};

DwcReporter.prototype.register = function(jasmineEnv) {
  // create and attach the JUnit reporter
  jasmineEnv.addReporter(new DwcReporter(this.config,this.instanceConfig,this.logger,this.collector));
};

module.exports = function(config,instanceConfig,logger,collector){
  return new DwcReporter(config,instanceConfig,logger,collector);
};