/**
 * Provide jasmine locator
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function JQueryLocator(config, instanceConfig, logger) {
  this.logger = logger;
}

/**
 * Register jasmine locator
 * @param {By} by - jasmine By object on which to add the new locator
 */
JQueryLocator.prototype.register = function (by) {
  this.logger.debug('Registering jquery locator');
  // http://angular.github.io/protractor/#/api?view=ProtractorBy.prototype.addLocator

  by.addLocator('jq', function (query, opt_parentElement) {
    return $(opt_parentElement ? opt_parentElement + ' ' + query : query).toArray();
  });
};

module.exports = function (config, instanceConfig, logger) {
  return new JQueryLocator(config, instanceConfig, logger);
};
