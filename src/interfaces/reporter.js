/**
 * @typedef ReporterConfig
 * @type {Object}
 */

/**
 * Report test execution
 * @constructor
 * @param {Config} config - global config
 * @param {ReporterFactoryConfig} instanceConfig - instance config
 * @param {Logger} logger
 */
function Reporter(config,instanceConfig,logger){
}

/**
 * Register jasmine reporter
 * @param {Env} jasmineEnv - jasmine environment on which to add the new reporter
 */
Reporter.prototype.register = function(jasmineEnv) {
};
