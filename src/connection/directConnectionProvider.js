var path = require('path');
var os = require('os');
var fs = require('fs');

var _ = require('lodash');
var mkdirp = require('mkdirp');
var q = require('q');
var request = require('request');
var AdmZip = require('adm-zip');
var tar = require('tar');

var ConnectionProvider = require('./../interface/connectionProvider');
var LatestDriverVersionResolver = require('./latestDriverVersionResolver');
var DirectDriverProvider = require('./directDriverProvider');

var LATEST_VERSION_REGEXP = /{.*?latest}/g;
var BINARIES = {
  SELENIUM: 'selenium',
  CHROMEDRIVER: 'chromedriver',
  IEDRIVER: 'iedriver',
  GECKODRIVER: 'geckodriver'
};

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
function DirectConnectionProvider(config, instanceConfig, logger, plugins) {
  ConnectionProvider.call(this, config, instanceConfig, logger, plugins);

  this.seleniumConfig = {};
  this.seleniumConfig.executables = {};
  this.seleniumConfig.address = config.seleniumAddress;
  this.seleniumConfig.host = config.seleniumHost;
  this.seleniumConfig.port = config.seleniumPort;
  this.seleniumConfig.useSeleniumJarFlag = 
    typeof config.useSeleniumJar !== 'undefined' ? config.useSeleniumJar : false;
  this.seleniumConfig.addressProxy = config.seleniumAddressProxy;
  this.seleniumConfig.seleniumLoopback =
    typeof config.seleniumLoopback !== 'undefined' ? config.seleniumLoopback : false;
  this.binaries = instanceConfig.binaries;

  this.runtimes = [];
  this.latestDriverVersionResolver = new LatestDriverVersionResolver(config, {
    latestVersionRegexp: LATEST_VERSION_REGEXP
  }, logger);
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

  // prepare correct driver and/or selenium jar, download if necessary
  var promises = [q()];
  if (!that.seleniumConfig.address) {
    // start local driver
    if (that.seleniumConfig.useSeleniumJarFlag) {
      promises.push(this._getBinaryFileName(BINARIES.SELENIUM).then(
        function(filename){
          that.seleniumConfig.executables.selenium = filename;
        })
      );
    }

    // switch on browser
    that.runtimes.forEach(function(runtime){
      var browserName = runtime.browserName;
      if (browserName == 'chrome' || browserName == 'chromeMobileEmulation' || browserName == 'chromeHeadless') {
        promises.push(that._getBinaryFileName(BINARIES.CHROMEDRIVER).then(
          function(filename){
            that.seleniumConfig.executables.chromedriver = filename;
          })
        );
      } else if (browserName == 'ie') {
        promises.push(that._getBinaryFileName(BINARIES.IEDRIVER).then(
          function(filename){
            that.seleniumConfig.executables.iedriver = filename;
          })
        );
      } else if (browserName == 'firefox') {
        promises.push(that._getBinaryFileName(BINARIES.GECKODRIVER).then(
          function(filename){
            that.seleniumConfig.executables.geckodriver = filename;
          })
        );
      } else if (browserName == 'edge') {
        promises.push((function() {
          var deferred = q.defer();
          var filename = path.join(that._getSeleniumRoot(), 'MicrosoftWebDriver.exe');
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

DirectConnectionProvider.prototype.buildDriverProvider = function (protConfig) {
  return new DirectDriverProvider(protConfig, this.logger, this.seleniumConfig, this.plugins);
};

DirectConnectionProvider.prototype._getBinaryFileName = function(binaryName) {
  var that = this;
  var binary = that.binaries[binaryName];
  if (binary.localPath) {
    return that._checkIfBinaryExists(binary.localPath);
  } else {
    return that._downloadBinary(binary);
  }
};

DirectConnectionProvider.prototype._getLatestVersion = function (binary) {
  if (_.isString(binary.version) && binary.version.match(LATEST_VERSION_REGEXP)) {
    return this.latestDriverVersionResolver.getLatestVersion(binary)
      .then(function (result) {
        binary.version = result.latestVersion;
        binary.executable = binary.executable.replace(LATEST_VERSION_REGEXP, result.latestVersion);
        binary.url = binary.url.replace(LATEST_VERSION_REGEXP, binary.version);
        return binary;
      });
  } else {
    var deferred = q.defer();
    deferred.resolve();
    return deferred.promise;
  }
};

DirectConnectionProvider.prototype._downloadDriver = function(binary) {
  var that = this;

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

            var newName = that._renameExecutable(filenamePath, binary.filename, binary.executable);

            // delete the zip
            fs.unlinkSync(filenameZip);

            resolveFn(newName);
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
          resolveFn(that._renameExecutable(filenamePath, binary.filename, binary.executable));
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

DirectConnectionProvider.prototype._downloadBinary = function (binary) {
  var that = this;
  var root = that._getSeleniumRoot();

  if(typeof binary.executable === 'object') {
    binary.executable =  root + '/' + binary.executable[that.config.osTypeString];
  } else {
    binary.executable =  root + '/' + binary.executable;
  }
  binary.executable = path.resolve(binary.executable);

  return that._getLatestVersion(binary).then(function () {
    return that._checkIfBinaryExists(binary.executable, true).then(function (pathToExistingBinary) {
      if (pathToExistingBinary) {
        var deferred = q.defer();
        deferred.resolve(pathToExistingBinary);
        return deferred.promise;
      } else {
        return that._downloadDriver(binary);
      }
    });
  });
};


DirectConnectionProvider.prototype._renameExecutable = function (filePath, name, newName) {
  var fullName = path.join(filePath, name);
  var newFullName = path.join(newName);
  try {
    // rename to final name
    fs.renameSync(fullName, newName);

    // make executable
    if (os.type() !== 'Windows_NT') {
      fs.chmodSync(newFullName, 0755);
    }

    // resolve with final name
    return newName;
  } catch(err) {
    throw new Error('Error while renaming "' + fullName + '" to "' + newFullName + ' ,details: ' + err);
  }
};

DirectConnectionProvider.prototype._checkIfBinaryExists = function (binaryPath, createIfMissing) {
  var that = this;
  var deferred = q.defer();
  fs.stat(binaryPath, function (err, stat) {
    if (err || stat.size == 0) {
      // create path
      if (createIfMissing) {
        mkdirp(path.dirname(binaryPath), function (err) {
          if (err) {
            deferred.reject(new Error('Error while creating path for binary: ' + binaryPath + ', details: ' + err));
          } else {
            deferred.resolve();
          }
        });
      } else {
        deferred.reject(new Error('Did not find binary locally: ' + binaryPath + ', details: ' + err));
      }
    } else {
      that.logger.info('Found correct binary locally: ' + binaryPath);
      // file exist => resolve with known name
      deferred.resolve(binaryPath);
    }
  });

  return deferred.promise;
};

DirectConnectionProvider.prototype._getSeleniumRoot = function () {
  return path.resolve(__dirname + '/../../selenium').replace(/\\/g,'/');
};

module.exports = function(config, instanceConfig, logger, plugins){
  return new DirectConnectionProvider(config, instanceConfig, logger, plugins);
};
