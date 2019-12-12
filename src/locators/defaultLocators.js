var clientsidescripts = require('../scripts/clientsidescripts');
var ByControlLocator = require('./byControlLocator');

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
  this.logger.debug('Registering default locators');
  // http://angular.github.io/protractor/#/api?view=ProtractorBy.prototype.addLocator

  by.addLocator('jq', function(query,opt_parentElement) {
    return $(opt_parentElement ? opt_parentElement + ' ' + query : query).toArray();
  });

  var byControlLocator = new ByControlLocator(clientsidescripts, this.logger);
  byControlLocator.register(by, 'control');

  /* example of how to register a new locator that:
   * accepts an arbitrary JSON, translates it to an OPA5 declarative JSON object, and uses the internal logic of by.control to find a control
   * by.ui5 = function (mMatchers) { // mMatchers = {elementProperties:{metadata: "sap.m.Button"}}
   *   var mOPA5Matchers = {};
   *   if (mMatchers.elementProperties && mMatchers.elementProperties.metadata) {
   *     mOPA5Matchers.controlType = mMatchers.elementProperties.metadata;
   *   }
   *   // mOPA5Matchers = {controlType: "sap.m.Button"}
   *   return byControlLocator.apply(mOPA5Matchers);
   * };
   */
};

module.exports = function(config,instanceConfig,logger){
  return new DefaultLocators(config,instanceConfig,logger);
};
