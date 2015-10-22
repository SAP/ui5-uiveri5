
var SpecReporter = require('jasmine-spec-reporter');

/**
 * @typedef ConsoleReporterConfig
 * @type {Object}
 * @extends {ReporterConfig}
 */

/**
 * Report test execution
 * @constructor
 * @param {Config} config - global config
 * @param {ConsoleReporterConfig} factoryConfig - instance config
 * @param {Logger} logger
 */
function ConsoleReporter(config,instanceConfig,logger) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
}

/**
 * Register jasmine reporter
 * @param {Env} jasmineEnv - jasmine environment on which to add the new reporter
 */
ConsoleReporter.prototype.register = function(jasmineEnv) {
  var that = this;

  // create and attach our console reporter
  jasmineEnv.addReporter(new SpecReporter(that.instanceConfig));
};

module.exports = function(config,instanceConfig,logger){
  return new ConsoleReporter(config,instanceConfig,logger);
};
