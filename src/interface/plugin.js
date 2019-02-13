/* eslint no-unused-vars: */
/**
 * Extends uiveri5 functionality
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function Plugin(config,instanceConfig,logger){
}

/**
 * Called after uiveri5 is started but before the webdriver connection is opened.
 * 
 * @return {Promise<void>|void} Can return a promise that will be waited to 
 * be resolved before uiveri5 continues.
 */
Plugin.prototype.setup = function() {
};

/**
 * Called after webdriver connection is established but before tests are started.
 * 
 * @return {Promise<void>|void} Can return a promise that will be waited to 
 * be resolved before uiveri5 continues.
 */
Plugin.prototype.onPrepare = function() {
};

/**
 * Called before the suite is started
 * 
 * @param {String} suite.name - suite name
 */
Plugin.prototype.suiteStarted = function(suite) {
};

/**
 * Called before the spec is started
 * 
 * @param {String} spec.name - spec name
 */
Plugin.prototype.specStarted = function(spec) {
};

/**
 * Called after the spec is done
 * 
 * @param {String} spec.name - spec name
 * @param {(passed|failed)} spec.status - spec status
 */
Plugin.prototype.specDone = function(spec) {
};

/**
 * Called after the suite is done
 * 
 * @param {String} suite.name - suite name
 * @param {(passed|failed)} suite.status - suite status
 */
Plugin.prototype.suiteDone = function(suite) {
};

/**
 * Called after all tests are executed but before webdriver connection is closed.
 * 
 * @return {Promise<void>|void} Can return a promise that will be waited to 
 * be resolved before uiveri5 continues.
 */
Plugin.prototype.onComplete = function() {
};

/**
 * Called after webdriver connection is closed
 * 
 * @return {Promise<void>|void} Can return a promise that will be waited to 
 * be resolved before uiveri5 continues.
 */
Plugin.prototype.teardown = function() {
};
