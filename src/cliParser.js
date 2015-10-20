var _ = require('lodash');
var fs = require('fs');
var path = require('path');

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
    var localConf = './conf.js';
    if (fs.existsSync(localConf)) {
      config.conf = localConf;
    }
  }

  // current dir conf is resolved against cwd()
  if (config.conf){
    config.conf = path.resolve(config.conf);
  }

  // TODO research how dot notation works with duplicates ?
  // resolve browsers argument
  if (config.browsers){
    if(_.isString(config.browsers)){
      var browsers = config.browsers.split(/,(?=[^\}]*(?:\{|$))/);
      config.browsers = [];
      browsers.forEach(function(browser){
        var confBrowser;
        /*
        if (browser.indexOf('{') !== -1 && browser.indexOf('}') !== -1){
          // JSON formatting found => parse it
          confBrowser = JSON.parse(browser);
        } else
        */
        if (browser.indexOf(':') !== -1) {
          // : separator found => split on them
          var browserParams = browser.split(':');
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
          // capabilities could not be given in this notation
        } else {
          // no formatting found => only browser name
          confBrowser = {
            browserName: browser
          };
        }
        config.browsers.push(confBrowser);
      });
    }
  }

  // parse generic configuration from JSON
  var confDef = config.config;
  if (confDef){
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

  return config;
};

/**
 * Merge objects and arrays
 */
function _mergeConfig(object,src){
  return _.merge(object,src,function(objectValue,sourceValue){
    if (_.isArray(objectValue)) {
      return objectValue.concat(sourceValue);
    }
  });
};

module.exports = function () {
  return new CliParser();
};
