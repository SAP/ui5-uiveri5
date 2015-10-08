
var _ = require('lodash');
var ConnectionProvider = require('./interfaces/connectionProvider');

/**
 * @typedef DirectConnectionProviderConfig
 * @type {Object}
 * @extends {ConnectionProviderConfig}
 */

/**
 * Provides connection to the test environment
 * @constructor
 * @param config - config
 * @param logger - logger
 */
function DirectConnectionProvider(config,logger) {
  ConnectionProvider.call(this,arguments);
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

  // format platformName and platformVersion
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

module.exports = function(config, logger){
  return new DirectConnectionProvider(config, logger);
};
