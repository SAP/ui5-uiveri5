var path = require('path');
var os = require('os');
var fs = require('fs');

var _ = require('lodash');
var mkdirp = require('mkdirp');
var proxyquire =  require('proxyquire');
var q = require('q');
var request = require('request');
var AdmZip = require('adm-zip');
var tar = require('tar');

var ConnectionProvider = require('./../interface/connectionProvider');

/**
 * @typedef DirectConnectionProviderConfig
 * @type {Object}
 * @extends {ConnectionProviderConfig}
 * @property seleniumAddress - Address of remote selenium server, if missing will start local webdriver
 * @property seleniumHost - Override the hostname to connect to local webdriver or selenium jar
 * @property seleniumPort - Override the default port used by the local webdriver or selenium jar
 * @property useSeleniumJar - Use selenium jar to start local webdrivers, default to true
 * @property seleniumAddressProxy - Use this proxy for the WD connection to remote selenium server
 */

/**
 * Provides connection to the test environment
 * @constructor
 * @param config - config
 * @param logger - logger
 */
function DirectConnectionProvider(config,instanceConfig,logger) {
  ConnectionProvider.call(this,config,instanceConfig,logger);

  this.seleniumConfig = {};
  this.seleniumConfig.executables = {};
  this.seleniumConfig.address = config.seleniumAddress;
  this.seleniumConfig.host = config.seleniumHost;
  this.seleniumConfig.port = config.seleniumPort;
  this.seleniumConfig.useSeleniumJarFlag =
    typeof config.useSeleniumJar !== 'undefined' ? config.useSeleniumJar : true;
  this.seleniumConfig.addressProxy = config.seleniumAddressProxy;
  this.seleniumConfig.seleniumLoopback =
    typeof config.seleniumLoopback !== 'undefined' ? config.seleniumLoopback : false;
  this.binaries = instanceConfig.binaries;

  this.runtimes = [];
}
DirectConnectionProvider.prototype = _.create(ConnectionProvider.prototype,{
  'constructor': DirectConnectionProvider
});

/**
 * Prepare capabilities object for this session
 * @param {Runtime} runtime - required runtime for this session
 * @return {Object} capabilities of this session
 */
DirectConnectionProvider.prototype.resolveCapabilitiesFromRuntime = function(runtime){
  // save this runtime so setupEnv() could download respective drivers
  this.runtimes.push(runtime);

  var capabilities = {};

  // capabilities according:
  // https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities
  // http://appium.io/slate/en/master/?ruby#appium-server-capabilities

  // format browserName
  if (runtime.platformName === 'android' || runtime.platformName === 'ios') {
    capabilities.browserName = runtime.browserName.charAt(0).toUpperCase() + runtime.browserName.slice(1);
  } else {
    if (runtime.browserName === 'ie') {
      capabilities.browserName = 'internet explorer';
    } else if (runtime.browserName === 'edge') {
      capabilities.browserName = 'MicrosoftEdge';
    } else {
      capabilities.browserName = runtime.browserName;
    }
  }

  // format browserVersion
  if (runtime.browserVersion !== '*') {
    capabilities.version = runtime.browserVersion;
  }

  // format platformName
  if (runtime.platformName === 'windows') {
    if (runtime.platformVersion === '*') {
      capabilities.platform = 'WINDOWS';
    } else if (runtime.platformVersion === 'XP') {
      capabilities.platform = 'XP';
    } else if (runtime.platformVersion === 'VISTA' || runtime.platformVersion === '7') {
      capabilities.platform = 'VISTA';
    } else if (runtime.platformVersion === '8') {
      capabilities.platform = 'WIN8';
    } else if (runtime.platformVersion === '8.1') {
      capabilities.platform = 'WIN8_1';
    } else {
      throw Error('Platform version: ' + runtime.platformVersion +
      ' for platformName: WINDOWS is not supported by directConnectionProvider');
    }
  } else if (runtime.platformName === 'linux' || runtime.platformName === 'mac') {
    capabilities.platform = runtime.platformName.toUpperCase();
  } else if (runtime.platformName === 'ios') {
    capabilities.platformName = 'iOS';
  } else if (runtime.platformName === 'android') {
    capabilities.platformName = 'Android';
  } else {
    throw Error('Platform name: ' + runtime.platformName +	
      ' not supported by directConnectionProvider');	
  }

  // format platformVersion
  if (runtime.platformVersion !== '*'){
    capabilities.platformVersion = runtime.platformVersion;
  }

  // format deviceName
  if (runtime.deviceName !== '*'){
    capabilities.deviceName = runtime.deviceName;
  }

  return this._mergeRuntimeCapabilities(capabilities,runtime);
};


DirectConnectionProvider.prototype.buildProtractorArgv = function(){
  var protractorArgv = {};

  // require direct connection as directDriverProvider will be overtaken later
  protractorArgv.directConnect = true;

  return protractorArgv;
};

/**
 * Setup this connection provider environment
 * @return {q.promise} A promise which will resolve when the environment is ready to test.
 */
DirectConnectionProvider.prototype.setupEnv = function() {
  var that = this;

  // attach our custom driverProviders
  var driverProviders = require('protractor/built/driverProviders');
  driverProviders.buildDriverProvider = function (protConfig) {
    return new DirectDriverProvider(protConfig, that.logger, that.seleniumConfig);
  };
  proxyquire('protractor/built/runner', {
    './driverProviders': driverProviders
  });

  // prepare correct driver and/or selenium jar, download if necessary
  var promises = [q()];
  if (!that.seleniumConfig.address) {
    // start local driver
    if (that.seleniumConfig.useSeleniumJarFlag) {
      promises.push(this._downloadBinary(that.binaries['selenium']).then(
        function(filename){
          that.seleniumConfig.executables.selenium = filename;
        })
      );
    }

    // switch on browser
    that.runtimes.forEach(function(runtime){
      var browserName = runtime.browserName;
      if (browserName == 'chrome' || browserName == 'chromeMobileEmulation' || browserName == 'chromeHeadless') {
        promises.push(that._downloadBinary(that.binaries['chromedriver']).then(
          function(filename){
            that.seleniumConfig.executables.chromedriver = filename;
          })
        );
      } else if (browserName == 'ie') {
        promises.push(that._downloadBinary(that.binaries['iedriver']).then(
          function(filename){
            that.seleniumConfig.executables.iedriver = filename;
          })
        );
      } else if (browserName == 'firefox') {
        promises.push(that._downloadBinary(that.binaries['geckodriver']).then(
          function(filename){
            that.seleniumConfig.executables.geckodriver = filename;
          })
        );
      } else if (browserName == 'edge') {
        promises.push((function() {
          var deferred = q.defer();
          var root = path.resolve(__dirname + '/../../selenium').replace(/\\/g,'/');
          var filename = path.join(root, 'MicrosoftWebDriver.exe');
          that.seleniumConfig.executables.edgedriver = filename;
          deferred.resolve(filename);
          return deferred.promise;
        })());
      } else {
        that.logger.debug('No need to download webdriver binary for: ' + browserName);
      }
    });
  }

  return q.all(promises);
};

DirectConnectionProvider.prototype._getLatestVersion = function(binary) {
  var that = this;

  that.logger.info('Check for latest version of: ' + binary.filename);
  return q.Promise(function(resolveFn, rejectFn) {
    request({url: binary.latestVersionUrlRedirect || binary.latestVersionUrl}, function(error, res, body) {
      if(error || res.statusCode != 200) {
        rejectFn(new Error('Error while getting the latest version number for ' + binary.filename +  
          (error ? (', error: ' + error) : 
            (res && res.statusCode ? (', status code: ' + res.statusCode) : ''))));
      } else {
        var latestVersion;

        // resolve latest version
        if(binary.latestVersionUrl) {
          latestVersion = body;
        } else if(binary.latestVersionUrlRedirect) {
          // request to the latest version is redirected to the latest release, so get the version from req.path
          var redirectPath = res.req.path.split('/');
          latestVersion = redirectPath[redirectPath.length - 1];
        } 

        if (!latestVersion) {
          rejectFn(new Error('Latest version resolving is not configured correctly, one of latestVersionUrl: ' + binary.latestVersionUrl + 
          ' or latestVersionUrlRedirect: ' + binary.latestVersionUrlRedirect + ' should be provided'));
        } else {
          that.logger.info('Found latest webdriver version: ' + latestVersion);
          binary.version = latestVersion;
          binary.executable = binary.executable.replace('{latest}',latestVersion);
          resolveFn(binary);
        }
      }
    });
  });
};

DirectConnectionProvider.prototype._downloadDriver = function(binary) {
  var that = this;
  binary.url = binary.url.replace(/{latest}/g, binary.version);
  binary.executable = binary.executable.replace('{latest}', binary.version);

  return q.Promise(function(resolveFn, rejectFn) {
    that.logger.info('Downloading webdriver binary: ' + binary.url);
    // download executable
    var requestStream = request({
      url: binary.url
    }).on('error',function (err) {
      rejectFn(new Error('Error while downloading: ' + binary.url + ' ,details: ' + err +
        '\nPlease make sure you have internet connection. ' +
        'If necessary, set HTTP_PROXY and HTTPS_PROXY environment variables'));
    });
    // unzip if necessary
    if (binary.unzip === true || binary.unzip === 'true'){
      var filenameZip = binary.executable + '.zip';
      requestStream.pipe(fs.createWriteStream(filenameZip))
        .on('error', function (err) {
          rejectFn(new Error('Error while saving zip file: ' + filenameZip + ' ,details: ' + err));
        })
        .on('finish', function () {
          // unzip the content and rename to correct name
          try {
            var filenamePath = path.dirname(filenameZip);

            var zip = new AdmZip(filenameZip);
            zip.extractAllTo(filenamePath,true);

            // rename the extracted file to final name
            fs.renameSync(filenamePath + '/' + binary.filename,binary.executable);

            // make exacutable
            if (os.type() !== 'Windows_NT') {             
              fs.chmodSync(path.join(binary.executable),0755);
            }

            // delete the zip
            fs.unlinkSync(filenameZip);

            // resolve with final name
            resolveFn(binary.executable);
          } catch(err) {
            rejectFn(new Error('Error while processing: ' + filenameZip + ' ,details: ' + err));
          }
        });
    } else if (binary.untar === true || binary.untar === 'true') {
      var filenamePath = path.dirname(binary.executable);
      requestStream.pipe(
        tar.extract({
          cwd: filenamePath
        }))
        .on('error', function (err) {
          rejectFn(new Error('Error while extracting tar.jz file: ' + binary.executable + ' ,details: ' + err));
        })
        .on('finish', function () {
          try {
            // rename to final name
            fs.renameSync(filenamePath + '/' + binary.filename,binary.executable);

            // make exacutable
            if (os.type() !== 'Windows_NT') {             
              fs.chmodSync(path.join(binary.executable),0755);
            }

            // resolve with final name
            resolveFn(binary.executable);
          } catch(err) {
            rejectFn(new Error('Error while processing: ' + binary.executable + ' ,details: ' + err));
          }
        });
    } else {
      requestStream.pipe(fs.createWriteStream(binary.executable))
        .on('error', function (err) {
          rejectFn(new Error('Error while saving: ' + binary.executable + ' ,details: ' + err));
        })
        .on('finish', function () {
          resolveFn(binary.executable);
        });
    }
  });
};

DirectConnectionProvider.prototype._downloadBinary = function(binary) {
  var that = this;
  var root = path.resolve(__dirname + '/../../selenium').replace(/\\/g,'/');

  if(typeof binary.executable === 'object') {
    binary.executable =  root + '/' + binary.executable[that.config.osTypeString];
  } else {
    binary.executable =  root + '/' + binary.executable;
  }

  if(_.isString(binary.version) && binary.version.indexOf('latest') >= 0){
    return that._getLatestVersion(binary).then(function(){
      return that._checkIfBinaryExists(binary);
    });
  } else {
    return that._checkIfBinaryExists(binary);
  }  
};

DirectConnectionProvider.prototype._checkIfBinaryExists = function(binary) {
  var that = this;
  var deferred = q.defer();
  fs.stat(binary.executable, function (err, stat) {
    if (err || stat.size == 0) {
      // create path
      mkdirp(path.dirname(binary.executable), function (err) {
        if (err) {
          deferred.reject(new Error('Error while creating path for binary: ' + binary.executable + ' ,details: ' + err));
        } else {
          deferred.resolve(that._downloadDriver(binary));
        }
      });
    } else {
      that.logger.info('Found correct webdriver locally: ' + binary.executable);
      // file exist => resolve with known name
      deferred.resolve(binary.executable);
    }
  });

  return deferred.promise;
};
// overloaded DriverProvider to be injected

var DirectDriverProvider = function(protConfig,logger,seleniumConfig) {
  this.protConfig = protConfig;
  this.logger = logger;
  this.seleniumConfig = seleniumConfig;
  this.drivers = [];

  // use selenium-webdriver from protractor dependecies
  this.deps = {};
  this.deps.webdriver = protractorModule.require('selenium-webdriver');
  this.deps.http = protractorModule.require('selenium-webdriver/http');
  this.deps.remote = protractorModule.require('selenium-webdriver/remote');
  this.deps.command = protractorModule.require('selenium-webdriver/lib/command.js');
};

DirectDriverProvider.prototype.setupEnv = function() {
  return q();
};

DirectDriverProvider.prototype.getExistingDrivers = function() {
  return this.drivers.slice();
};

/**
 * Create a new driver augmented with appium support
 * @public
 * @override
 * @return webdriver instance
 */
DirectDriverProvider.prototype.getNewDriver = function() {
  var that = this;

  // open webdriver connection, start local webdriver if necessary
  var capabilities = new that.deps.webdriver.Capabilities(this.protConfig.capabilities);
  var driver;
  if (that.seleniumConfig.address) {
    that.logger.debug('Opening remote webdriver session to: ' + that.seleniumConfig.address);

    if (that.seleniumConfig.addressProxy) {
      that.logger.debug('Using proxy for webdriver connection: ' + that.seleniumConfig.addressProxy);
    }
    // connect to remote selenium
    var client = new that.deps.http.HttpClient(that.seleniumConfig.address, null,that.seleniumConfig.addressProxy);
    var executor =  new that.deps.http.Executor(client);
    driver = that.deps.webdriver.WebDriver.createSession(executor,capabilities);

    //augment with appium support
    var CONTEXT_COMMAND = 'context';
    executor.defineCommand(CONTEXT_COMMAND,'POST','/session/:sessionId/context');

    driver.switchContext = function (name) {
      that.logger.debug('Switch context to: ' + name);
      return driver.schedule(
        new that.deps.command.Command(CONTEXT_COMMAND)
          .setParameter('name', name),
        'WebDriver.switchContext()'
      );
    };
  } else {
    // start local driver
    if (that.seleniumConfig.useSeleniumJarFlag) {
      // by default selenium is started without specifying host, on findFreePort, returns net.getAddress()
      // host, port and returned host could be overridden
      that.logger.debug('Starting local selenium server with executable: ' +
        that.seleniumConfig.executables.selenium);

      // set selenium options
      var opts = {
        args: []
      };
      // port
      if (that.seleniumConfig.port){
        opts.port = that.seleniumConfig.port;
      }
      // host
      if (that.seleniumConfig.host){
        opts.args = opts.args.concat(['-host',that.seleniumConfig.host]);
      }

      // seleniumOptions.args
      if(this.protConfig.capabilities.seleniumOptions && this.protConfig.capabilities.seleniumOptions.args){
        opts.args = opts.args.concat(this.protConfig.capabilities.seleniumOptions.args);
      }
      // local webdriver binaries
      opts.jvmArgs = [];
      var browserName = this.protConfig.capabilities.browserName;
      if (browserName == 'chrome') {
        opts.jvmArgs.push('-Dwebdriver.chrome.driver=' + that.seleniumConfig.executables.chromedriver);
      } else if (browserName == 'firefox') {
        opts.jvmArgs.push('-Dwebdriver.gecko.driver=' + that.seleniumConfig.executables.geckodriver);
      } else if (browserName == 'internet explorer') {
        opts.jvmArgs.push('-Dwebdriver.ie.driver=' + that.seleniumConfig.executables.iedriver);
      } else if (browserName == 'MicrosoftEdge') {
        opts.jvmArgs.push('-Dwebdriver.edge.driver=' + that.seleniumConfig.executables.edgedriver);
      }

      var seleniumServer = new that.deps.remote.SeleniumServer(that.seleniumConfig.executables.selenium,opts);

      // loopback connecting to selenium server
      that.seleniumConfig.seleniumLoopback ? seleniumServer.loopbackOnly_ = true : seleniumServer.loopbackOnly_ = false;

      // start the selenium server, override the host if necessary
      var addressPromise = seleniumServer.start().then(
        function(address){
          that.logger.debug('Selenium server started and listening at: ' + address);
          return address;
        }
      );

      // start the remote webdriver against this local selenium server
      executor = new that.deps.http.Executor(
        that.deps.webdriver.promise.when(addressPromise, function (url) {
          return new that.deps.http.HttpClient(url, null);
        })
      );
      driver = that.deps.webdriver.WebDriver.createSession(executor,capabilities);
    } else  {
      // switch on browser
      browserName = this.protConfig.capabilities.browserName;
      if (browserName == 'chrome') {
        that.deps.chrome = protractorModule.require('selenium-webdriver/chrome');

        // chromedriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        that.logger.debug('Starting local chromedriver with executable: ' +
          that.seleniumConfig.executables.chromedriver);

        var chromeServiceBuilder = new that.deps.chrome.ServiceBuilder(that.seleniumConfig.executables.chromedriver);

        // set chromedriverOptions
        var chromedriverOptions = this.protConfig.capabilities.chromedriverOptions;
        if (chromedriverOptions){
          _.forIn(chromedriverOptions,function(value,key){
            chromeServiceBuilder[key].apply(chromeServiceBuilder,value);
          });
        }

        // build chromeOptions from capabilities
        var chromeOptions = that.deps.chrome.Options.fromCapabilities(capabilities);

        // start the local chromedriver and connect to it
        var chromeService = chromeServiceBuilder.build();
        driver =  that.deps.chrome.Driver.createSession(
          chromeOptions,chromeService);
      } else if (browserName == 'firefox') {
        that.deps.firefox = protractorModule.require('selenium-webdriver/firefox');

        // geckodriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        that.logger.debug('Starting local geckodriver with executable: ' + 
          that.seleniumConfig.executables.geckodriver);

        var firefoxServiceBuilder = new that.deps.firefox.ServiceBuilder(that.seleniumConfig.executables.geckodriver);

        // set geckodriverOptions
        var geckodriverOptions = this.protConfig.capabilities.geckodriverOptions;
        if (geckodriverOptions){
          _.forIn(geckodriverOptions,function(value,key){
            firefoxServiceBuilder[key].apply(firefoxServiceBuilder,value);
          });
        }
        
        // no firefox.Options.fromCapabilities() so need to build firefoxOptions manually 
        var firefoxOptions = new that.deps.firefox.Options();
        var capabilitiesFirefoxOptions = this.protConfig.capabilities.firefoxOptions;
        if (capabilitiesFirefoxOptions){
          _.forIn(capabilitiesFirefoxOptions,function(value,key){
            firefoxOptions[key].apply(firefoxOptions,value);
          });
        }

        // start the local geckodriver and connect to it
        var firefoxService = firefoxServiceBuilder.build();
        driver =  that.deps.firefox.Driver.createSession(
          firefoxOptions,firefoxService);
      } else if (browserName == 'internet explorer') {
        that.deps.ie = protractorModule.require('selenium-webdriver/ie');

        // iedriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        that.logger.debug('Starting local iedriver with executable: ' +
          that.seleniumConfig.executables.iedriver);

        // set iedriver executable
        process.env.PATH = process.env.PATH + path.delimiter + path.dirname(that.seleniumConfig.executables.iedriver);

        var driverOptions = new that.deps.ie.Options();
        if (this.protConfig.capabilities.iedriverOptions) {
          _.forIn(this.protConfig.capabilities.iedriverOptions, function (value, key) {
            var funcName = key;
            if (funcName.startsWith('ie.')) {
              funcName = funcName.substring(3);
            }
            that.deps.ie.Options.prototype[funcName].apply(driverOptions, value);
          });
        }
        var browserOptions = new that.deps.ie.Options();
        if (this.protConfig.capabilities.ieOptions) {
          _.forIn(this.protConfig.capabilities.ieOptions, function (value, key) {
            that.deps.ie.Options.prototype[key].apply(browserOptions, value);
          });
        }
        // merge capabilities
        var allIECapabilities = driverOptions.toCapabilities(browserOptions.toCapabilities());
        // start the local iedriver and connect to it
        driver = that.deps.ie.Driver.createSession(that.deps.ie.Options.fromCapabilities(allIECapabilities));
      } else if (browserName == 'MicrosoftEdge') {
        that.deps.edge = protractorModule.require('selenium-webdriver/edge');

        that.logger.debug('Starting local edgedriver with executable: ' +
          that.seleniumConfig.executables.edgedriver);

        var edgeOptions = [new that.deps.edge.Options(), new that.deps.edge.Options()];
        _.forEach(['edgedriverOptions', 'edgeOptions'], function (capabilitiesKey, index) {
          _.forIn(that.protConfig.capabilities[capabilitiesKey], function (value, key) {
            that.deps.edge.Options.prototype[key].apply(edgeOptions[index], value);
          });
        });
        // merge capabilities
        var allEdgeCapabilities = edgeOptions[0].toCapabilities(edgeOptions[1].toCapabilities());

        // start the local edgedriver and connect to it
        var edgeServiceBuilder = new that.deps.edge.ServiceBuilder(that.seleniumConfig.executables.edgedriver);
        driver =  that.deps.edge.Driver.createSession(allEdgeCapabilities, edgeServiceBuilder.build());
      } else if (browserName == 'safari') {
        that.deps.safari = protractorModule.require('selenium-webdriver/safari');

        // by default safari server always started at 'localhost' and findFreePort, returns 'localhost'
        // nothing could be overridden
        that.logger.debug('Starting local safaridriver from system path');

        var safariServiceBuilder = new that.deps.safari.ServiceBuilder();

        // set safaridriverOptions
        var saferidriverOptions = this.protConfig.capabilities.safaridriverOptions;
        if (saferidriverOptions){
          _.forIn(saferidriverOptions,function(value,key){
            safariServiceBuilder[key].apply(safariServiceBuilder,value);
          });
        }

        // build safariOptions from capabilities
        var safariOptions = that.deps.safari.Options.fromCapabilities(capabilities);

        // start the local safaridriver and connect to it
        driver = new that.deps.webdriver.Builder()
          .withCapabilities(safariOptions.toCapabilities())
          .usingServer(safariServiceBuilder.build().start())
          .build();
      } else {
        throw new Error('Browser with name: ' + browserName + ' is not supported');
      }
    }
  }

  this.drivers.push(driver);
  return driver;
};

DirectDriverProvider.prototype.quitDriver = function(driver) {
  var driverIndex = this.drivers.indexOf(driver);
  if (driverIndex >= 0) {
    this.drivers.splice(driverIndex, 1);
  }

  var deferred = q.defer();
  driver.getSession().then(function(session_) {
    if (session_) {
      driver.quit().then(function() {
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
  });
  return deferred.promise;
};

DirectDriverProvider.prototype.teardownEnv = function() {
  return q.all(this.drivers.map(this.quitDriver.bind(this)));
};

module.exports = function(config,instanceConfig,logger){
  return new DirectConnectionProvider(config,instanceConfig,logger);
};
