/**
 * Created by I304310 on 7/22/2015.
 */
'use strict';
var logger = require('./logger.js');
/**
 * @typedef LocalScreenshotProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 * @property (boolean) update - update ref with actual screenshot
 */

/**
 * Screenshot provider
 * @constructor
 * @implements {ScreenshotProvider}
 * @param (LocalScreenshotProviderConfig} config - configs
 */
function LocalScreenshotProvider(config) {
  this.config = config;
}

/**
 * Takes a screenshot of the current browser state
 * @typedef takeScreenshot
 * @type {function}
 * @global
 * @return {webdriver.promise<Buffer>} promise that resolves with screenshot image blob
 *
 * if(config.take) => log info and take the screenshot. Then if(config.update) store the screenshot as ref.
 *
 */

/**
 * Registers takeScreenshot at global variable
 */
LocalScreenshotProvider.prototype.register = function() {
  var that = this;
  global.takeScreenshot = function() {
    // uses browser object and call webdriverjs function takeScreenshot
    return browser.takeScreenshot().then(function(encodedScreenshot) {
      if(that.config.localScreenshotProvider.take) {
        logger.debug('Taking screenshot');
        return encodedScreenshot;
      } else {
        logger.debug('Skipping screenshot taking');
        return [];
      }
    });
  };
};

module.exports = function (config) {
  return new LocalScreenshotProvider(config);
};
