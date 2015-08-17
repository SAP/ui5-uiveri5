/**
 * @typedef StorageProviderConfig
 * @type {Object}
 * @extends {Config}
 */

/**
 * @typedef Runtime
 * @type {Object}
 * @param {string(chrome|firefox|ie|safari,edge)} browserName - browser name, default: chrome
 * @param {number} browserVersion - browser version, default: *
 * @param {string(windows|mac|linux|android|ios|winphone)} platformName - platform name, default: windows
 * @param {number} platformVersion - platform number like 7,8 for windows; 4.4,5.0 for android;, default: *
 * @param {string(default|/\d+x\d+/)} platformResolution - platform resolution, WIDTHxHEIGHT, default: resolved from available
 * @param {string(bluecrystal|hcp)} ui5.theme - UI5 theme, default bluecrystal
 * @param {string(rtl|ltr)} ui5.direction - UI5 direction, default: ltr
 * @param {string(cosy|compact)} ui5.mode - UI5 mode, default: cosy
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
 * Hook, called before each specs
 * @param {Spec[]} specs - specs
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
StorageProvider.prototype.onAfterEachSpec = function(){
};

/**
 * Hook, called after each spec
 * @param {Spec} spec - spec
 *
 */
StorageProvider.prototype.onAfterAllSpecs = function(){
};
