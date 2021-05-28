
var _ = require('lodash');
var logger = require('./logger');

var DEFAULT_BROWSER_NAME = 'chrome';
var DEFAULT_VERSION = '*';
var DEFAULT_UI5_THEME = 'belize';
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
var platformNamePerOsTypeString = {
  unknown: 'windows',
  win32: 'windows',
  linux32: 'linux',
  linux64: 'linux',
  mac64: 'mac'
};
var supportedBrowserNames = [
  'chrome','chromium','browser','chromeMobileEmulation','firefox','ie','safari','edge','chromeHeadless'
];
var supportedPlatformNames = [
  'windows','mac','linux','android','ios','winphone'
];
var supportedUI5Themes = [
  'bluecrystal','belize','fiori_3','fiori_3_dark'
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
 * @param {string(bluecrystal|belize|fiori_3|fiori_3_dark)} ui5.theme - UI5 theme, default belize
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
 */
function RuntimeResolver(config) {
  this.config = config;
}

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
      runtime.platformName = platformNamePerOsTypeString[that.config.osTypeString];
    }
    if(supportedPlatformNames.indexOf(runtime.platformName)==-1){
      throw Error('Platform: ' + runtime.platformName + ' is not supported, use one of: ' +
        JSON.stringify(supportedPlatformNames));
    }
    // TODO validate runtime-platform combinations ?

    // handler platformResolution
    if(!runtime.platformResolution || runtime.platformResolution === '*') {
      runtime.platformResolution = defaultPlatformResolutionPerPlatformName[runtime.platformName];
    }
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

    // merge with browserCapabilities for this browser and runtime
    if (!runtime.capabilities) {
      runtime.capabilities = {};
    }

    if (that.config.browserCapabilities) {
      that._mergeMatchingCapabilities(runtime,that.config.browserCapabilities);
    }

    logger.debug('Resolved runtime: ' + JSON.stringify(runtime));
  });

  return runtimes;
};

RuntimeResolver.prototype._mergeMatchingCapabilities = function(runtime,browserCapabilities){
  var currentExecutionType = this._getExecutionType();
  // loop over all capabilities
  var browserNamePattern;
  for (browserNamePattern in browserCapabilities){
    if (this._isMatching(runtime.browserName,browserNamePattern)){
      var platformNamePattern;
      for (platformNamePattern in browserCapabilities[browserNamePattern]){
        if (this._isMatching(runtime.platformName,platformNamePattern)){
          var executionTypePattern;
          for(executionTypePattern in browserCapabilities[browserNamePattern][platformNamePattern]){
            if(this._isMatching(currentExecutionType, executionTypePattern)){
              runtime.capabilities = _.mergeWith({},
                browserCapabilities[browserNamePattern][platformNamePattern][executionTypePattern],
                runtime.capabilities,
                function(objValue, srcValue) {
                  if (_.isArray(objValue) && srcValue) {
                    return _(objValue).concat(srcValue).uniqWith(_.isEqual).value();
                  }
                });
            }
          }
        }
      }
    }
  }
};

RuntimeResolver.prototype._getExecutionType = function() {
  return this.config.seleniumAddress ? 'remote' : 'local';
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

module.exports = function (config) {
  return new RuntimeResolver(config);
};
