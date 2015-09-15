/**
 * Created by I304310 on 7/22/2015.
 */
'use strict';

var DEFAULT_TAKE = true;

/**
 * @typedef LocalScreenshotProviderConfig
 * @type {Object}
 * @extends {ScreenshotProviderConfig}
 * @property {boolean} take - enable screenshot taking
 * @property {boolean} update - update ref with actual screenshot
 */

/**
 * Screenshot provider
 * @constructor
 * @implements {ScreenshotProvider}
 * @param {LocalScreenshotProviderConfig} config
 * @param {Logger} logger
 */
function LocalScreenshotProvider(config,logger) {
  this.config = config;
  this.logger = logger;

  this.take = config.take || DEFAULT_TAKE;
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
      that.logger.debug('Skipp taking actual screenshot');
      return '';
    }
  };
};

module.exports = function (config, logger) {
  return new LocalScreenshotProvider(config, logger);
};
