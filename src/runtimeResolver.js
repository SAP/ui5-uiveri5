
var _ = require('lodash');

var DEFAULT_BROWSER_NAME = 'chrome';
var DEFAULT_PLATFORM_NAME = 'windows';
var DEFAULT_VERSION = '*';
var DEFAULT_DEVICE_NAME = '*';
var DEFAULT_UI5_THEME = 'bluecrystal';
var DEFAULT_UI5_DIRECTION = 'ltr';
var DEFAULT_UI5_MODE = 'cozy';

var defaultPlatformResolutionPerPlatformName = {
  windows: '1600x1200',
  mac: '1280x1024',
  linux: '1600x1200',
  android: '320x480',
  ios: '1536х1854',
  winphone: '1080x1920'
};
var defaultPlatformNamePerBrowserName = {
  ie: 'windows',
  edge: 'windows',
  safari: 'mac'
};
var supportedBrowserNames = [
  'chrome','chromium','browser','firefox','ie','safari','edge'
];
var supportedPlatformNames = [
  'windows','mac','linux','android','ios','winphone'
];
var supportedUI5Themes = [
  'bluecrystal','hcb'
];
var supportedUI5Directions = [
  'ltr','rtl'
];
var supportedUI5Modes = [
  'cozy','compact'
];

/**
 * @typedef Runtime
 * @type {Object}
 * @param {string(chrome|chromium|browser|firefox|ie|safari|edge)} browserName - browser name, default: chrome
 * @param {number} browserVersion - browser version, default: *
 * @param {string(windows|mac|linux|android|ios|winphone)} platformName - platform name, default: windows
 * @param {number} platformVersion - platform number like 7,8 for windows; 4.4,5.0 for android;, default: *
 * @param {string(default|/\d+x\d+/)} platformResolution - platform resolution, WIDTHxHEIGHT, default: resolved from available
 * @param {string} deviceName - device name, default: *
 * @param {string(bluecrystal|hcb)} ui5.theme - UI5 theme, default bluecrystal
 * @param {string(rtl|ltr)} ui5.direction - UI5 direction, default: ltr
 * @param {string(cozy|compact)} ui5.mode - UI5 mode, default: cozy
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
function RuntimeResolver(config,logger,connectionProvider){
  this.config = config;
  this.logger = logger;
  this.connectionProvider = connectionProvider;
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

    // handle device name
    if (!runtime.deviceName) {
      runtime.deviceName = DEFAULT_DEVICE_NAME;
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

    // merge with browserCapabilities for this browser and runtime
    if (!runtime.capabilities) {
      runtime.capabilities = {};
    }
    if (that.config.browserCapabilities) {
      that._mergeMatchingCapabilities(runtime,that.config.browserCapabilities);
          /*
       // merge this specific browser capabilities
       var capabilities = that.config.browserCapabilities[runtime.browserName];
       if(capabilities){
       _.merge(runtime.capabilities,capabilities);
       }

       // merge 'generic' browser capabilities
       capabilities = that.config.browserCapabilities['generic'];
       if(capabilities){
       _.merge(runtime.capabilities,capabilities);
       }
      */
    }

    that.logger.debug('Resolved runtime: ' + JSON.stringify(runtime));
  });

  return runtimes;
};

RuntimeResolver.prototype._mergeMatchingCapabilities = function(runtime,browserCapabilities){
  // loop over all capabilities
  var browserNamePattern;
  for (browserNamePattern in browserCapabilities){
    if (this._isMatching(runtime.browserName,browserNamePattern)){
      var platformNamePattern;
      for (platformNamePattern in browserCapabilities[browserNamePattern]){
        if (this._isMatching(runtime.platformName,platformNamePattern)){
          _.merge(runtime.capabilities,browserCapabilities[browserNamePattern][platformNamePattern]);
        }
      }
    }
  }
};

/**
 * Matcher a name against a pattern
 * @param name - the name
 * @param pattern - comma separated list of names or * for all or ! to exclude
 * @returns true if name matches the pattern
 */
RuntimeResolver.prototype._isMatching = function(name,pattern){
  var matchingFlag = false;
  var patternNames = pattern.split(',');
  patternNames.forEach(function(patternName){
    if (patternName === name){
      matchingFlag = true;
    } else if (patternName === '*'){
      matchingFlag = true;
    } else if (patternName.charAt(0) === '!'){
      patternName = patternName.slice(1);
      if (patternName === name){
        matchingFlag = false;
      }
    }
  });
  return matchingFlag;
};

/**
 * Prepare protractor/selenium browser capabilities from runtime
 * @param {[Runtime]} runtimes - requsted runtimes
 */
RuntimeResolver.prototype.resolveMultiCapabilitiesFromRuntimes = function(runtimes){
  var that = this;

  // resolve capabilities from runtime over this provider
  var protractorMultiCapabilities = runtimes.map(function(runtime){

    // prepare capabilities from runtime for this specific connection type
    return that.connectionProvider.resolveCapabilitiesFromRuntime(runtime);
  });

  that.logger.debug('Resolved protractor multiCapabilities: ' + JSON.stringify(protractorMultiCapabilities));
  return protractorMultiCapabilities;
};

/**
 * Enrich runtime from connected browser capabilities
 * @param capabilities
 * @return {Runtime} updated runtime with values from capabilities
 */
RuntimeResolver.prototype.resolveRuntimeFromCapabilities = function(capabilities){

  return this.connectionProvider.resolveRuntimeFromCapabilities(capabilities);
};

module.exports = function(config,logger,connectionProvider){
  return new RuntimeResolver(config,logger,connectionProvider);
};
