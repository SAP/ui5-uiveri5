var webdriver = require('selenium-webdriver');
var clientsidescripts = require('./scripts/clientsidescripts');

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
};

module.exports = function(config,instanceConfig,logger){
  return new DefaultLocators(config,instanceConfig,logger);
};
