/* eslint no-unused-vars: */
/**
 * Resolves specs
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 * @param {Object} runtime
 */
function ScreenshotProvider(config,instanceConfig,logger,runtime){
}

/**
 * Takes a screenshot of the current browser state
 * @typedef takeScreenshot
 * @type {function}
 * @global
 * @return {webdriver.promise<Buffer>} promise that resolves with screenshot image blob
 *
 * If (config.take) => log info and take the screenshot, else log info message and return.
 */

/**
 * Registers global screenshot taking function
 */
ScreenshotProvider.prototype.register = function(){
};

