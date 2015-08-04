/**
 * @typedef StorageProviderConfig
 * @type {Object}
 */

/**
 * @typedef Runtime
 * @type {Object}
 * @param {string(chrome|firefox|ie|safari)} browserName - browser name
 * @param {number} browserVersion - browser version
 * @param {string(windows|mac|linux|android|ios)} platformName - platform name
 * @param {number} platformVersion - platform number like 7,8 for windows; 4.4,5.0 for android;
 * @param {string(/\d+x\d+/)} platformResolution - platform resolution, WIDTHxHEIGHT
 * @param {string(bluecrystal|hcp)} ui5.theme - UI5 theme
 * @param {string(rtl|ltr)} ui5.direction - UI5 direction
 * @param {string(cosy|compact)} ui5.direction - UI5 mode
 */

/**
 * Stores and loads images
 * @constructor
 * @param {StorageProviderConfig} config - configs
 * @param {RuntimeConfig} runtimeProps - runtime properties
 */
function StorageProvider(config,runtime){
  this.config  = config;
  this.runtime = runtime;
}

//// API for the comparisonProvider

/**
 * Returns the ref image read stream
 * @param {string} refImageName - reference image name
 * @return {ReadStream} - read stream for the reference image content
 */
StorageProvider.prototype.readRefImage = function(refImageName){
};

/**
 * Returns the diff image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the diff image content
 */
StorageProvider.prototype.storeDiffImage = function(refImageName){
};

//// API to screenshotProvider

/**
 * Returns the ref image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
StorageProvider.prototype.storeRefImage = function(refImageName){
};

/**
 * Hook, called before all specs
 * @param {Spec[]} specs - specs
 *
 * Used to implement 'cache' for RemoteLfsStorageProvider
 */
StorageProvider.prototype.onBeforeAllSpecs = function(){
};

/**
 * Hook, called after each spec
 * @param {Spec} spec - spec
 *
 * Used to implement 'upload' for RemoteLfsStorageProvider
 */
StorageProvider.prototype.onAfterEachSpec = function(){
};
