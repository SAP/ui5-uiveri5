
var url = require('url');
var path = require('path');
var os = require('os');
var fs = require('fs');

var _ = require('lodash');
var mkdirp = require('mkdirp');
var proxyquire =  require('proxyquire');
var q = require('q');
var request = require('request');
var AdmZip = require('adm-zip');

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

  // attach our custom driverProvider
  proxyquire('protractor/lib/runner',
    {'./driverProviders/direct': function(protConfig){
        return new DirectDriverProvider(protConfig,that.logger,that.seleniumConfig);
      }
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
      if (browserName == 'chrome') {
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
      } else {
        that.logger.debug('No need to download webdriver binary for: ' + browserName);
      }
    });
  }

  return q.all(promises);
};

DirectConnectionProvider.prototype._downloadBinary = function(binary){
  var that = this;
  var deferred = q.defer();
  var root = path.resolve(__dirname + '/../../selenium').replace(/\\/g,'/');

  // compute OS type strings
  binary.chromeOsTypeString = function(){
    // return type string depending on current OS
    if (os.type() == 'Darwin') {
      return 'mac32';
    } else if (os.type() == 'Linux') {
      if (os.arch() == 'x64') {
        return 'linux64';
      } else {
        return 'linux32';
      }
    } else if (os.type() == 'Windows_NT') {
      return 'win32';
    } else {
      throw new Error('Unsupported OS: ' + os.type() + ' for chromedriver');
    }
  }();

  // resolve vars
  var url = _.template(binary.url)(binary);
  var filename = _.template(binary.filename)(binary);
  var executable =  root + '/' + _.template(binary.executable)(binary);

  // check if binary already exist
  fs.stat(executable,function(err,stat){
    if (err || stat.size == 0) {
      // create path
      mkdirp(path.dirname(executable),function (err) {
        if(err) {
          deferred.reject(new Error('Error while creating path for binary: ' + executable + ' ,details: ' + err));
        } else {
          that.logger.info('Downloading webdriver binary: ' + url);
          // download executable
          var requestStream = request({
            url: url
          }).on('error',function (err) {
              deferred.reject(new Error('Error while downloading: ' + url + ' ,details: ' + err +
              '\nPlease make sure you have internet connection. ' +
              'If necessary, set HTTP_PROXY and HTTPS_PROXY environment variables'));
            });
          // unzip if necessary
          if (binary.unzip){
            var filenameZip = executable + '.zip';
            requestStream.pipe(fs.createWriteStream(filenameZip))
              .on('error', function (err) {
                deferred.reject(new Error('Error while saving zip file: ' + filenameZip + ' ,details: ' + err));
              })
              .on('finish', function () {
                // unzip the content and rename to correct name
                try {
                  var filenamePath = path.dirname(filenameZip);

                  var zip = new AdmZip(filenameZip);
                  zip.extractAllTo(filenamePath,true);

                  // rename the extracted file to final name
                  var extractedFilename = filenamePath + '/';
                  if (os.type() == 'Windows_NT') {
                    fs.renameSync(filenamePath + '/' + filename + '.exe',executable);
                  } else {
                    fs.renameSync(filenamePath + '/' + filename,executable);

                    // fix the executable flag
                    fs.chmodSync(path.join(argv.out_dir,filename),0755);
                  }

                  // delete the zip
                  fs.unlinkSync(filenameZip);

                  // resolve with final name
                  deferred.resolve(executable);
                } catch(err) {
                  deferred.reject(new Error('Error while processing: ' + filenameZip + ' ,details: ' + err));
                }
              });
          } else {
            requestStream.pipe(fs.createWriteStream(executable))
              .on('error', function (err) {
                deferred.reject(new Error('Error while saving: ' + executable + ' ,details: ' + err));
              })
              .on('finish', function () {
                deferred.resolve(executable);
              });
          }
        }
      });
    } else {
      that.logger.info('Found correct webdriver locally: ' + executable);
      // file exist => resolve with known name
      deferred.resolve(executable);
    }
  });

  // return promise, resolve with file name when ready
  return deferred.promise;
};

//// overloaded DriverProvider to be injected

var DirectDriverProvider = function(protConfig,logger,seleniumConfig) {
  this.protConfig = protConfig;
  this.logger = logger;
  this.seleniumConfig = seleniumConfig;
  this.drivers = [];

  // use selenium-webdriver from protractor dependecies
  this.deps = {};
  this.deps.webdriver = protractorModule.require('selenium-webdriver');
  this.deps.executors = protractorModule.require('selenium-webdriver/executors');
  this.deps.http = protractorModule.require('selenium-webdriver/http');
  this.deps.remote = protractorModule.require('selenium-webdriver/remote');
  this.deps.chrome = protractorModule.require('selenium-webdriver/chrome');
  this.deps.firefox = protractorModule.require('selenium-webdriver/firefox');
  this.deps.ie = protractorModule.require('selenium-webdriver/ie');
  this.deps.safari = protractorModule.require('selenium-webdriver/safari');
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

    // connect to remote selenium
    var client = new that.deps.http.HttpClient(that.seleniumConfig.address, null,that.seleniumConfig.addressProxy);
    var executor =  new that.deps.http.Executor(client);
    driver = that.deps.webdriver.WebDriver.createSession(executor,capabilities);
    //TODO augment with appium support
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
      } else if (browserName == 'internet explorer') {
        opts.jvmArgs.push('-Dwebdriver.ie.driver=' + that.seleniumConfig.executables.iedriver);
      }
      var seleniumServer = new that.deps.remote.SeleniumServer(that.seleniumConfig.executables.selenium,opts);

      // start the selenium server, override the host if necessary
      var addressPromise = seleniumServer.start().then(
        function(address){
          // override hostname
          if (that.seleniumConfig.host) {
            var urlObj = url.parse(address);
            urlObj.hostname =  that.seleniumConfig.host;
            address = url.format(urlObj);
          }
          that.logger.debug('Selenium server started and listening at: ' + address);
          return address;
        }
      );

      // start the remote webdriver against this local selenium server
      var executor = new that.deps.executors.DeferredExecutor(
        that.deps.webdriver.promise.when(addressPromise, function(url) {
          var client = new that.deps.http.HttpClient(url, null);
          return new that.deps.http.Executor(client);
        })
      );
      driver = that.deps.webdriver.WebDriver.createSession(executor,capabilities);
    } else  {
      // switch on browser
      var browserName = this.protConfig.capabilities.browserName;
      if (browserName == 'chrome') {
        // by default chromedriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        // only port could be overridden
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

        // set port
        if (that.seleniumConfig.port){
          chromeServiceBuilder.usingPort(that.seleniumConfig.port);
        }

        // start the local chromedriver and connect to it
        var chromeService = chromeServiceBuilder.build();
        driver =  new that.deps.chrome.Driver(capabilities,chromeService);
      } else if (browserName == 'firefox') {
        // firefox is started without specifying host, on findFreePort, returns getLoopbackAddress
        // nothing could be overridden
        that.logger.debug('Starting local firefox with webdriver extension');

        // start firefox with selenium extension and connect to it
        driver = new that.deps.firefox.Driver(capabilities);
      } else if (browserName == 'internet explorer') {
        // by default iedriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        // only host could be overridden - only set it to webdriver, could not override of the returned getLoopbackAddress address !!!
        that.logger.debug('Starting local iedriver with executable: ' +
          that.seleniumConfig.executables.iedriver);

        // set host
        if (that.seleniumConfig.host){
          capabilities.host = that.seleniumConfig.host;
        }

        // set iedriver executable
        process.env.PATH = process.env.PATH + path.delimiter + that.seleniumConfig.executables.iedriver;

        // start the local iedriver and connect to it
        driver = new that.deps.ie.Driver(capabilities);
      } else if (browserName == 'safari') {
        // by default safari server always started at 'localhost' and findFreePort, returns 'localhost'
        // nothing could be overridden
        that.logger.debug('Starting local safari with webdriver extension');

        // start safari with selenium extension and connect to it
        driver = new that.deps.safari.Driver(capabilities);
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
