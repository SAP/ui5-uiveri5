
var _ = require('lodash');
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

ConnectionProvider.prototype.buildProtractorArgv = function(){
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
 * Prepare capabilities object for this session
 * @param {Runtime} runtime - required runtime for this session
 * @return {Object} capabilities of this session
 */
ConnectionProvider.prototype.resolveCapabilitiesFromRuntime = function(runtime) {

  return this._mergeRuntimeCapabilities({},runtime);
};

ConnectionProvider.prototype._mergeRuntimeCapabilities = function(capabilities,runtime) {
  // merge capabilities on root level
  _.merge(capabilities,runtime.capabilities);

  // provide runtime in browser capabilities
  capabilities.runtime = runtime;

  return capabilities;
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
