
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
 * @return {q.promise<{refImageUrl:Buffer},{Error}>} - promise that resolves with ref image url
 */
StorageProvider.prototype.storeRefImage = function(refImageName,refImageBuffer){
};

/**
 * Store new act image
 * @param {string} actImageName  - act image name
 * @param {Buffer} actImageBuffer - actual image buffer
 * @return {q.promise<{actImageUrl},{Error}>} - promise that resolves with act image url
 */
StorageProvider.prototype.storeActImage = function(actImageName,actImageBuffer){
};

/**
 * Store new diff image
 * @param {string} diffImageName  - diff image name
 * @param {Buffer} diffImageBuffer - diff image buffer
 * @return {q.promise<{diffImageUrl},{Error}>} - promise that resolves with diff image url
 */
StorageProvider.prototype.storeDiffImage = function(diffImageName,diffImageBuffer){
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
