/* eslint no-unused-vars: */
/**
 * Stores and loads images
 * @constructor
 * @param {LocalStorageProviderConfig}
 * @param {LocalStorageProviderInstanceConfig}
 * @param {Logger} logger
 * @param {Runtime} runtime
 */
function StorageProvider(config,instanceConfig,logger,runtime){
}

/**
 * Read ref image
 * @param {string} refImageName - reference image name
 * @return {q.promise<{refImageBuffer:Buffer,refImageUrl:string},{Error}>} - promise that resolves with data and image url
 */
StorageProvider.prototype.readRefImage = function(refImageName){
};

/**
 * Store new ref image
 * @param {string} refImageName  - reference image name
 * @param {Buffer} refImageBuffer - reference image buffer
 * @return {q.promise<{refImageUrl},{Error}>} - promise that resolves with ref image url
 */
StorageProvider.prototype.storeRefImage = function(imageName,refImageBuffer){
};

/**
 * Store new reference, actual and difference images
 * @param {string} imageName  - image name
 * @param {Buffer} actImageBuffer - actual image buffer, also stored as new reference image
 * @param {Buffer} diffImageBuffer - diff image buffer
 * @param {boolean} updateRefFlag - whether to update ref image
 * @return {q.promise<{refImageUrl,actImageUrl,diffImageUrl},{Error}>} - promise that resolves with images urls
 */
StorageProvider.prototype.storeRefActDiffImage = function(imageName,actImageBuffer,diffImageBuffer){
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
