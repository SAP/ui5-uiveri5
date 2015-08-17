/**
 * @typedef ComparisonProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 * @property {boolean} compare - enable screenshot comparison
 */

/**
 * Resolves specs
 * @constructor
 * @param {ComparisonProviderConfig} config - configs
 * @param {StorageProvider} storageProvider - the storage provider to use
 */
function ComparisonProvider(config,storageProvider){
  this.config  = config;
  this.storageProvider = storageProvider;
}

/**
 * Compare actual screenshot to reference screenshot
 * @typedef toLookLike
 * @type {function}
 * @extends Jasmine.compare
 * @global
 * @param {string} refImageName - ref image name to compare against
 * @param {wabdriver.promise<Buffer>} - actImageBuf - actual screenshot
 *
 * If (config.take) => log info and take the screenshot, else log info message and return.
 * If (config.take && config.compare) => log info message and execute compare, else log an info message and return.
 * Resolves the refImageName to a refImageBuf using the given storageProvider.
 * Resolves the actual screenshot promise to actImageBuf. Feeds both buffers to resemble
 * and if difference store the diff and act images using storageProvider.
  * If (config.take && config.compare & config.update) store the act image as ref image else just return.
 */

/**
 * Registers the jasmine custom matchers
 */
ComparisonProvider.prototype.register = function(){
};
