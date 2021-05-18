var _ = require('lodash');
var logger = require('./logger');

module.exports = {
  logFrameworkVersion: function () {
    var pjson = require('../package.json');
    logger.info(pjson.name + ' v' + pjson.version);
  },

  getOSType: function () {
    var os = require('os');
    var osType = '';

    if (os.type() == 'Darwin') {
      osType = 'mac64';
    } else if (os.type() == 'Linux') {
      if (os.arch() == 'x64') {
        osType = 'linux64';
      } else {
        osType = 'linux32';
      }
    } else if (os.type() == 'Windows_NT') {
      osType = 'win32';
    } else {
      osType = 'unknown';
    }

    return osType;
  },

  copyTimeouts: function (launcherArgv, config) {
    if (config.timeouts) {
      if (config.timeouts.getPageTimeout) {
        var getPageTimeout = config.timeouts.getPageTimeout;
        if (_.isString(getPageTimeout)) {
          getPageTimeout = parseInt(getPageTimeout, 10);
        }
        logger.debug('Setting getPageTimeout: ' + getPageTimeout);
        launcherArgv.getPageTimeout = getPageTimeout;
      }
      if (config.timeouts.allScriptsTimeout) {
        var allScriptsTimeout = config.timeouts.allScriptsTimeout;
        if (_.isString(allScriptsTimeout)) {
          allScriptsTimeout = parseInt(allScriptsTimeout, 10);
        }
        logger.debug('Setting allScriptsTimeout: ' + allScriptsTimeout);
        launcherArgv.allScriptsTimeout = allScriptsTimeout;
      }
      if (config.timeouts.defaultTimeoutInterval) {
        var defaultTimeoutInterval = config.timeouts.defaultTimeoutInterval;
        if (_.isString(defaultTimeoutInterval)) {
          defaultTimeoutInterval = parseInt(defaultTimeoutInterval, 10);
        }
        logger.debug('Setting defaultTimeoutInterval: ' + defaultTimeoutInterval);
        launcherArgv.jasmineNodeOpts.defaultTimeoutInterval = defaultTimeoutInterval;
      }
    }
  }
};
