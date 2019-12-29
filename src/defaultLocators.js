var webdriver = require('selenium-webdriver');
var clientsidescripts = require('./scripts/clientsidescripts');
var vyperParser = require('./parsers/vyperParser');

/**
 * Provide jasmine locator
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function DefaultLocators(config,instanceConfig,logger){
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
}

/**
 * Register jasmine locator
 * @param {By} by - jasmine By object on which to add the new locator
 */
DefaultLocators.prototype.register = function(by) {
  var that = this;

  this.logger.debug('Registering default locators');
  // http://angular.github.io/protractor/#/api?view=ProtractorBy.prototype.addLocator

  by.addLocator('jq', function(query,opt_parentElement) {
    return $(opt_parentElement ? opt_parentElement + ' ' + query : query).toArray();
  });

  // mMatchers is an OPA5 control selector map
  by.control = function (mMatchers) {
    return {
      findElementsOverride: function (driver, using, rootSelector) {

        if (mMatchers.id instanceof RegExp) {
          mMatchers.id = {regex: {source: mMatchers.id.source, flags: mMatchers.id.flags}};
        }
        if (mMatchers.properties) {
          Object.keys(mMatchers.properties).forEach(function (sProperty) {
            var vValue = mMatchers.properties[sProperty];
            if (vValue instanceof RegExp) {
              mMatchers.properties[sProperty] = {regex: {source: vValue.source, flags: vValue.flags}};
            }
          });
        }
        var sMatchers = JSON.stringify(mMatchers);
        return driver.findElements(webdriver.By.js(clientsidescripts.findByControl, sMatchers, using, rootSelector))
          .then(function (vResult) {
            if (vResult.length) {
              return vResult;
            } else {
              return driver.executeScript(clientsidescripts.getLatestLog)
                .then(function (sLatestLog) {
                  that.logger.debug('No elements found using by.control locator. This is what control locator last logged: ' + sLatestLog);
                  return vResult;
                });
            }
          });
      },
      toString: function toString() {
        var sMatchers = JSON.stringify(mMatchers);
        return 'by.control(' + sMatchers + ')';
      }
    };
  };

  by.addLocator('ui5All', function(mParams, index, rootSelector) {
    return {
      findElementsOverride: function (driver, using, rootSelector) {
      var vyperParserUtil = vyperParser(mParams, index, rootSelector);
      var oElementMatchers;
      var oAncestorMatchers;
      var oDescentantMatchers;
      var oSiblingMatchers;
      var sVeri5Matchers;

      if(mParams){
        oElementMatchers = vyperParserUtil.parseProperties();
        //oAncestorMatchers = vyperParserUtil.ancestorPropertiesParser();
        //oDescentantMatchers = vyperParserUtil.childrenPropertiesParser();
        //oSiblingMatchers = vyperParserUtil.siblingPropertiesParser();

        sVeri5Matchers = {
          oElementMatchers
          //ancestor: oAncestorMatchers,
          //descendant: oDescentantMatchers,
        };
        return driver.findElements(webdriver.By.js(clientsidescripts.findByControl, sVeri5Matchers, using, rootSelector))
            .then(function (vResult) {
              if (vResult.length) {
                return vResult;
              } else {
                return driver.executeScript(clientsidescripts.getLatestLog)
                  .then(function (sLatestLog) {
                    that.logger.debug('No elements found using by.control locator. This is what control locator last logged: ' + sLatestLog);
                    return vResult;
                  });
              }
            });

      } else{
        //Exception
      }
    }
  }
    /*
    
    if(oParams.elementProperties) {
      var param = {};
      
      if(oParams.elementProperties.metadata) {
        param.controlType = oParams.elementProperties.metadata;
      }

      if(oParams.elementProperties.mProperties) {
        if(oParams.elementProperties.mProperties.id) {
          var regex = RegExp(wildcardToRegExp(oParams.elementProperties.mProperties.id));
          param.id = regex;
        }
        delete oParams.elementProperties.mProperties.id;

        param.bindingPath = {};

        if(oParams.elementProperties.bindingContextPath) {
          // wildcards not usable currently
          param.bindingPath['path'] = oParams.elementProperties.bindingContextPath;
          //Iterate through object/array properties
          // ...
          var mProps = oParams.elementProperties.mProperties;
          for(var key in mProps) {
            var value = mProps[key];
            if(value && typeof value === "object") {
              param.bindingPath['propertyPath'] = value;
            } else if(value && Array.isArray(value)) {
              value.map(function(locatorBindingData){
                compareBindingPathAndModelProperty(key, locatorBindingData, oControl);
              });
            }
          }
          //param.properties = oParams.elementProperties.mProperties;
        }
      }
        
      return by.control(param);
    }*/
    
  });
};

module.exports = function(config,instanceConfig,logger){
  return new DefaultLocators(config,instanceConfig,logger);
};
