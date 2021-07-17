var ControlLocator = require('./controlLocator');

/**
 * Example of how to register a new locator that
 * accepts an arbitrary JSON, translates it to an OPA5 declarative JSON object, and uses the internal logic of by.control to find a control
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function VyperLocator(config, instanceConfig, logger) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
}

/**
 * Register custom locator
 * @param {ProtractorBy} by protractor By object on which to add the new locator
 */
VyperLocator.prototype.register = function (by) {
  this.logger.debug('Registering custom locator');
  by.ui5 = function (mMatchers) {
    // mMatchers = {elementProperties:{metadata: "sap.m.Button"}}
    // mOPA5Matchers = {controlType: "sap.m.Button"}
    var mOPA5Matchers = {};
    if (mMatchers.elementProperties && mMatchers.elementProperties.metadata) {
      mOPA5Matchers.controlType = mMatchers.elementProperties.metadata;
    }
    var byControlLocator = new ControlLocator(this.logger);
    // the new locator will find elements by the OPA5 control locator.
    // if an element is not found, the selector will be logged as a stringified JSON
    return byControlLocator.apply(mOPA5Matchers);
  };
};

module.exports = function (config, instanceConfig, logger) {
  return new VyperLocator(config, instanceConfig, logger);
};
