
var _ = require('lodash');

var DEFAULT_BROWSER_NAME = 'chrome';
var DEFAULT_PLATFORM_NAME = 'windows';
var DEFAULT_VERSION = '*';
var DEFAULT_UI5_THEME = 'bluecrystal';
var DEFAULT_UI5_DIRECTION = 'ltr';
var DEFAULT_UI5_MODE = 'cosy';

defaultPlatformResolutionPerPlatformName = {
  windows: '1600x1200',
  mac: '1280x1024',
  linux: '1600x1200',
  android: '320x480',
  ios: '1536х1854',
  winphone: '1080x1920'
};
defaultPlatformNamePerBrowserName = {
  ie: 'windows',
  edge: 'windows',
  safari: 'mac'
};
supportedBrowserNames = [
  'chrome','firefox','ie','safari','edge'
];
supportedPlatformNames = [
  'windows','mac','linux','android','ios','winphone'
];
supportedUI5Themes = [
  'bluecrystal','hcp'
];
supportedUI5Directions = [
  'ltr','rtl'
];
supportedUI5Modes = [
  'cosy','compact'
];

/**
 * @typedef Runtime
 * @type {Object}
 * @param {string(chrome|firefox|ie|safari|edge)} browserName - browser name, default: chrome
 * @param {number} browserVersion - browser version, default: *
 * @param {string(windows|mac|linux|android|ios|winphone)} platformName - platform name, default: windows
 * @param {number} platformVersion - platform number like 7,8 for windows; 4.4,5.0 for android;, default: *
 * @param {string(default|/\d+x\d+/)} platformResolution - platform resolution, WIDTHxHEIGHT, default: resolved from available
 * @param {string(bluecrystal|hcp)} ui5.theme - UI5 theme, default bluecrystal
 * @param {string(rtl|ltr)} ui5.direction - UI5 direction, default: ltr
 * @param {string(cosy|compact)} ui5.mode - UI5 mode, default: cosy
 * @param {Object} capabilities - additional browser capabilities object
 */

/**
 * @typedef RuntimeResolverConfig
 * @type {Object}
 * @extends {Config}
 * @property {Object} browserCapabilities - default capabilities per browser
 */

/**
 * Resolves runtime
 * @constructor
 * @param {RuntimeResolverConfig} config
 * @param {Logger} logger
 */
function RuntimeResolver(config,logger){
  this.config = config;
  this.logger = logger;
};

/**
 * Resolve requires browser runtimes
 * @return {[Runtime]} - resolver runtime
 */
RuntimeResolver.prototype.resolveRuntimes = function(){
  var that = this;
  var runtimes = this.config.browsers;

  // no runtimes => run on chrome
  if (!runtimes) {
    runtimes = [{browserName: DEFAULT_BROWSER_NAME}];
  }

  // resolve missing fields with defaults and PerXxxx defaults
  runtimes.forEach(function(runtime){
    // handle browserName
    if (!runtime.browserName){
      throw Error('Browser name not specified');
    }
    if(supportedBrowserNames.indexOf(runtime.browserName)==-1){
      throw Error('Browser: ' + runtime.browserName + ' is not supported, use one of: ' +
        JSON.stringify(supportedBrowserNames));
    }

    // handle platformName
    if(!runtime.platformName){
      runtime.platformName = defaultPlatformNamePerBrowserName[runtime.browserName] || DEFAULT_PLATFORM_NAME;
    }
    if(supportedPlatformNames.indexOf(runtime.platformName)==-1){
      throw Error('Platform: ' + runtime.platformName + ' is not supported, use one of: ' +
        JSON.stringify(supportedPlatformNames));
    }
    // TODO validate runtime-platform combinations ?

    // handler platformResolution
    runtime.platformResolution = defaultPlatformResolutionPerPlatformName[runtime.platformName];
    // TODO validate platform-resolution combinations ?

    // handle versions
    if (!runtime.browserVersion){
      runtime.browserVersion = DEFAULT_VERSION;
    }
    if (!runtime.platformVersion){
      runtime.platformVersion = DEFAULT_VERSION;
    }

    // handle ui5 defaults
    if (!runtime.ui5){
      runtime.ui5 = {};
    }
    if(!runtime.ui5.theme){
      runtime.ui5.theme = DEFAULT_UI5_THEME;
    }
    if(supportedUI5Themes.indexOf(runtime.ui5.theme)==-1){
      throw Error('UI5 theme: ' + runtime.ui5.theme + ' is not supported, use one of: ' +
        JSON.stringify(supportedUI5Themes));
    }
    if(!runtime.ui5.direction){
      runtime.ui5.direction = DEFAULT_UI5_DIRECTION;
    }
    if(supportedUI5Directions.indexOf(runtime.ui5.direction)==-1){
      throw Error('UI5 direction: ' + runtime.ui5.direction + ' is not supported, use one of: ' +
        JSON.stringify(supportedUI5Directions));
    }
    if(!runtime.ui5.mode){
      runtime.ui5.mode = DEFAULT_UI5_MODE;
    }
    if(supportedUI5Modes.indexOf(runtime.ui5.mode)==-1){
      throw Error('UI5 mode: ' + runtime.ui5.mode + ' is not supported, use one of: ' +
       JSON.stringify(supportedUI5Modes));
    }

    // merge with browserCapabilities for this runtime
    if (!runtime.capabilities) {
      runtime.capabilities = {};
    }
    if (that.config.browserCapabilities) {
      var capabilities = that.config.browserCapabilities[runtime.browserName];
      if(capabilities){
        _.merge(runtime.capabilities,capabilities);
      }
    }

    that.logger.debug('Resolved runtime: ' + JSON.stringify(runtime));
  });

  return runtimes;
};

/**
 * Prepare protractor/selenium browser capabilities from runtime
 * @param {[Runtime]} runtimes - requsted runtimes
 */
RuntimeResolver.prototype.prepareMultiCapabilitiesFromRuntimes = function(runtimes){
  var that = this;

  var protractorMultiCapabilities = runtimes.map(function(runtime){
    // clone runtime without the capabilities
    var protractorCapabilities = _.clone(runtime,true);  // deep copy
    delete protractorCapabilities.capabilities;

    // merge capabilities on root level
    _.merge(protractorCapabilities,runtime.capabilities);

    // TODO rename/reformat some options ?
    return protractorCapabilities;
  });

  that.logger.debug('Resolved protractor multiCapabilities: ' + JSON.stringify(protractorMultiCapabilities));
  return protractorMultiCapabilities;
};

/**
 * Enrich runtime from connected browser capabilities
 * @param capabilities
 * @return {Runtime} updated runtime with values from capabilities
 */
RuntimeResolver.prototype.enrichRuntimeFromCapabilities = function(capabilities){

  // TODO parse and merge back options from capabilities

  return capabilities;
};

module.exports = function(config, logger){
  return new RuntimeResolver(config, logger);
};
