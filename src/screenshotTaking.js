/**
 * Created by I304310 on 7/22/2015.
 */
'use strict';
var logger = require('./logger.js');
/**
 * @typedef ScreenshotProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 * @property (boolean) update - update ref with actual screenshot
 * */

/**
 * Screenshot provider
 * @constructor
 * @param (ScreenshotTakingConfig} config - configs
 * */
function ScreenshotTaking(config) {
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
 * */

/**
 * Registers takeScreenshot at global variable
 * */
ScreenshotTaking.prototype.register = function() {
  var that = this;
  global.takeScreenshot = function() {
    // uses browser object and call webdriverjs function takeScreenshot
    return browser.takeScreenshot().then(function(screenshot) {
      if(that.config.take && !that.config.update) {
        logger.info('Taking screenshot.');
        return screenshot;
      } else if(that.config.update && !that.config.take) {
        logger.info('Updating reference image with new screenshot.');
        //TODO: update the ref image
        //storageProvider.storeRefImage(screenshot);
      } else {
        logger.error('Invalid user settings.');
        return [];
      }
    });
  };
};

module.exports = function (oConfig) {
  return new ScreenshotTaking(oConfig);
};
