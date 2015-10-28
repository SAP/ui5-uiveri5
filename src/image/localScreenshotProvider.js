
var DEFAULT_TAKE = true;

/**
 * @typedef LocalScreenshotProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 */

/**
 * @typedef LocalScreenshotProviderInstanceConfig
 * @type {Object}
 */

/**
 * Screenshot provider
 * @constructor
 * @implements {ScreenshotProvider}
 * @param {LocalScreenshotProviderConfig} config
 * @param {LocalScreenshotProviderInstanceConfig} instanceConfig
 * @param {Logger} logger
 */
function LocalScreenshotProvider(config,instanceConfig,logger) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;

  // set default for take if not provided
  this.take = typeof config.take !== 'undefined' ? config.take : DEFAULT_TAKE;
}

/**
 * Registers takeScreenshot at global variable
 */
LocalScreenshotProvider.prototype.register = function() {
  var that = this;

  global.takeScreenshot = function() {
    if (that.take) {
      // take screenshot once UI5 has settled down
      return browser.waitForAngular().then(function(){
        // uses browser object and call webdriverjs function takeScreenshot
        return browser.takeScreenshot().then(function (encodedScreenshot) {
          that.logger.debug('Taking actual screenshot');
          return encodedScreenshot;
        });
      });
    } else {
      that.logger.debug('Screenshot taking disabled so skipping it');
      return '';  // TODO return resolved promise ?
    }
  };
};

module.exports = function (config,instanceConfig,logger) {
  return new LocalScreenshotProvider(config,instanceConfig,logger);
};
