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
 * @param {StorageProvider} storageProvider - the storage provider to use ( get ref image, store diff image )
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
 * Resolves the refImageName to a refImageBuf using the given
 * storageProvider. Resolves the actual screenshot promise to actImagebuf. Feeds both buffers to resemble
 * and stores the diff image using imageProvider.
 * If (config.take && config.compare) => log info message and run, else log an info message and exit.
 */

/**
 * Registers the jasmine custom matchers
 */
ComparisonProvider.prototype.register = function(){
};
