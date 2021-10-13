
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var DEFAULT_CONF_FILE = './conf.js';

function CliParser(){
}

CliParser.prototype.parse = function(argv){

  // copy argv properties, no func, no prototype, no special members
  var config = {};
  for (var name in argv) {
    if (_.has(argv,name) && !_.isFunction(name) && !name.indexOf('$0')==0 && name!=='_') {
      config[name] = argv[name];
    }
  }

  // pass provided *.conf.js file
  config.conf = argv._[0];

  // conf file is not provided on command line => try loading conf.js from current dir
  if (!config.conf) {
    var localConf = DEFAULT_CONF_FILE;
    if (fs.existsSync(localConf)) {
      config.conf = localConf;
    }
  }

  // conf file name is resolved against cwd() to get absolute pathname
  if (config.conf){
    config.conf = path.resolve(config.conf);
  }

  // TODO research how dot notation works with duplicates ?
  // resolve browsers argument
  if (config.browsers){
    if(!_.isArray(config.browsers)) {
      config.browsers = [config.browsers];
    }
    var confBrowsers = [];
    config.browsers.forEach(function(browser){
      if(_.isObject(browser)){
        confBrowsers.push(browser);
      } else if(_.isString(browser)){
        confBrowsers = confBrowsers.concat(_parseBrowsersString(browser));
      }
    });
    config.browsers = confBrowsers;
  }

  // parse generic configuration from JSON
  var confDef = config.config;
  if (confDef){
    // in case of multiple config cli entries - with object notation or as JSON object
    // for example: --config.connectionConfigs.direct.binaries.chromedriver.localPath="path/to/driver" --config={"reporters: {...}"}
    if(_.isArray(confDef)) {
      confDef.forEach(function(conf) {
        _parseGenericConfigFromJson(config, conf);
      })
    } else {
      _parseGenericConfigFromJson(config, confDef);
    }
  }

  return config;
};

function _parseGenericConfigFromJson(config, confDef) {
  if(_.isString(confDef) && confDef.indexOf('{') !== -1 && confDef.indexOf('}') !== -1) {
    // JSON formatting found => parse it
    confDef = JSON.parse(confDef);
    // merge json config over
    _mergeConfig(config,confDef);
  } else if (_.isObject(confDef)){
    _mergeConfig(config,confDef);
    delete config.config;
  }

  // silently skipp any invalid config statements
}

function _parseBrowsersString(browsersString){
  var browsers = [];
  var browser = '';
  var openBracketCount = 0;

  for (var i = 0; i < browsersString.length; i++) {
    if(browsersString[i] === '{') {
      openBracketCount++;
      browser += browsersString[i];
    } else if (browsersString[i] === '}') {
      openBracketCount--;
      browser += browsersString[i];
      if(openBracketCount === 0 && i === (browsersString.length-1)) {
        browsers.push(browser);
      }
    } else if (browsersString[i] === ',') {
      if(openBracketCount === 0) {
        browsers.push(browser);
        browser = '';
      } else {
        browser += browsersString[i];
      }
    } else {
      browser += browsersString[i];
      if(i === (browsersString.length-1)) {
        browsers.push(browser);
      }
    }
  }

  var confBrowsers = [];
  var confBrowser;

  browsers.forEach(function(browserString) {
    if (browserString.indexOf('{') !== -1 && browserString.indexOf('}') !== -1) {
      confBrowsers.push(JSON.parse(browserString));
    } else {
      var browserParams = browserString.split(':');
      confBrowser = {};

      if (browserParams[0]) {
        confBrowser.browserName = browserParams[0];
      }
      if (browserParams[1]) {
        confBrowser.browserVersion = browserParams[1];
      }
      if (browserParams[2]) {
        confBrowser.platformName = browserParams[2];
      }
      if (browserParams[3]) {
        confBrowser.platformVersion = browserParams[3];
      }
      if (browserParams[4]) {
        confBrowser.platformResolution = browserParams[4];
      }
      if (browserParams[5] || browserParams[6] || browserParams[7]) {
        confBrowser.ui5 = {};
        if (browserParams[5]) {
          confBrowser.ui5.theme = browserParams[5];
        }
        if (browserParams[6]) {
          confBrowser.ui5.direction = browserParams[6];
        }
        if (browserParams[7]) {
          confBrowser.ui5.mode = browserParams[7];
        }
      }

      confBrowsers.push(confBrowser);
    }
  });

  return confBrowsers;
}
/**
 * Merge objects and arrays
 */
function _mergeConfig(object,src){
  return _.mergeWith(object,src,function(objectValue,sourceValue){
    if (_.isArray(objectValue)) {
      return objectValue.concat(sourceValue);
    }
  });
}

module.exports = function () {
  return new CliParser();
};
