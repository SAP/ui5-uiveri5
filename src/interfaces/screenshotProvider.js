/**
 * @typedef ScreenshotProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 * @property {boolean} update - update ref with act screenshot
 */

/**
 * Resolves specs
 * @constructor
 * @param {ScreenshotProviderConfig} config - configs
 * @param {StorageProvider} storageProvider - the storage provider to use ( update ref image )
 */
function ScreeenshotProvider(config){
  this.config  = config;
  this.storageProvider = storageProvider;
}

/**
 * Takes a screenshot of the current browser state
 * @typedef takeScreenshot
 * @type {function}
 * @global
 * @return {webdriver.promise<Buffer>} promise that resolves with screenshot image blob
 *
 * If (config.take) => log info and take the screenshot. Then if (config.update) store the screenshot as ref.
 */

/**
 * Registers global screenshot taking function
 */
ScreeenshotProvider.prototype.register = function(){
};

