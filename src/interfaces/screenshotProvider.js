/**
 * @typedef ScreenshotProviderConfig
 * @type {Object}
 */

/**
 * Resolves specs
 * @constructor
 * @param {ScreenshotProviderConfig} config - configs
 * @param {ImageResolver} imageResolver -
 */
function ScreeenshotProvider(config){
  this.config  = config;
}

/**
 * Take screenshot, decode and store at correct place
 * @return {String} absolute path to actual image
 */
ScreeenshotProvider.prototype.takeScreenshot = function(){
}

