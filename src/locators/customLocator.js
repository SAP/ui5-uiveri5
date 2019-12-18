var ControlLocator = require('./controlLocator');

/**
 * Example of how to register a new locator that
 * accepts an arbitrary JSON, translates it to an OPA5 declarative JSON object, and uses the internal logic of by.control to find a control
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function CustomLocator(config, instanceConfig, logger) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
}

/**
 * Register custom locator
 * @param {ProtractorBy} by protractor By object on which to add the new locator
 */
CustomLocator.prototype.register = function (by) {
  this.logger.debug('Registering custom locator');
  by.ui5 = function (mMatchers) {
    // mMatchers = {elementProperties:{metadata: "sap.m.Button"}}
    // mOPA5Matchers = {controlType: "sap.m.Button"}
    var mOPA5Matchers = {};
    if (mMatchers.elementProperties && mMatchers.elementProperties.metadata) {
      mOPA5Matchers.controlType = mMatchers.elementProperties.metadata;
    }
    var byControlLocator = new ControlLocator(this.logger);
    return byControlLocator.apply(mOPA5Matchers);
  };
};

module.exports = function (config, instanceConfig, logger) {
  return new CustomLocator(config, instanceConfig, logger);
};
