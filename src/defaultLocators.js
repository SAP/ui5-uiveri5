
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
};

module.exports = function(config,instanceConfig,logger){
  return new DefaultLocators(config,instanceConfig,logger);
};
