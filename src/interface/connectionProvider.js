var q = require('q');

/**
 * Provides connection to the test environment
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 * @param {Array} plugins
 */
function ConnectionProvider(config,instanceConfig,logger, plugins) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.plugins = plugins;
}

ConnectionProvider.prototype.buildLauncherArgv = function(){
  return {};
};

/**
 * Setup this connection provider environment
 * @return {q.promise} A promise which will resolve when the environment is ready to test.
 */
ConnectionProvider.prototype.setupEnv = function() {
  return q();
};

/**
 * Teardown this connection provider environment
 * @return {q.promise} A promise which will resolve when the environment is down.
 */
ConnectionProvider.prototype.teardownEnv = function() {
  return q();
};

/**
 * Enrich runtime with actual capabilities of this session
 * @param {Object} capabilities - capabilities of this session
 * @returns {Runtime} runtime extended from actual capabilities of this session
 */
ConnectionProvider.prototype.resolveRuntimeFromCapabilities = function(capabilities) {
  // TODO check for browserVersion and fail if different

  // TODO is it possible to check actual platformVersion ?

  // TODO is it possible to check actual resolution ?

  return capabilities.runtime;
};

module.exports = ConnectionProvider;
