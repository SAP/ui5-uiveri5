
/**
 * Stores and loads images
 * @constructor
 * @param {Config} config
 * @param {Logger} logger
 * @param {RuntimeConfig} runtimeProps - runtime properties
 */
function StorageProvider(config,logger,runtime){
}

/**
 * Returns the ref image read stream
 * @param {string} refImageName - reference image name
 * @return {ReadStream} - read stream for the reference image content
 */
StorageProvider.prototype.readRefImage = function(refImageName){
};

/**
 * Returns the ref image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
StorageProvider.prototype.storeRefImage = function(refImageName){
};

/**
 * Returns the act image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
StorageProvider.prototype.storeActImage = function(refImageName){
};

/**
 * Returns the diff image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the diff image content
 */
StorageProvider.prototype.storeDiffImage = function(refImageName){
};

/**
 * Hook, called before all specs
 * @param {Spec[]} specs - specs
 *
 * Used to implement 'cache' for RemoteLfsStorageProvider
 */
StorageProvider.prototype.onBeforeAllSpecs = function(specs){
};

/**
 * Hook, called before each spec
 * @param {Spec} spec - spec
 *
 * Used to store current spec name
 */
StorageProvider.prototype.onBeforeEachSpec = function(spec){
};

/**
 * Hook, called after each spec
 * @param {Spec} spec - spec
 *
 * Used to implement 'upload' for RemoteLfsStorageProvider
 */
StorageProvider.prototype.onAfterEachSpec = function(spec){
};

/**
 * Hook, called after all spec
 * @param {[Specs]} specs - specs
 */
StorageProvider.prototype.onAfterAllSpecs = function(specs){
};
