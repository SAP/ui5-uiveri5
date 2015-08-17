/**
 * @typedef LocalStorageProviderConfig
 * @type {Object}
 * @extends {StorageProviderConfig}
 * @property {string} localBasePath - local storage base path e.g. c:\openui5\target
 */

/**
 * Stores and loads images from local git structure
 * @constructor
 * @implements {StorageProvider}
 * @param {LocalStorageProviderConfig} config - configs
 * @param {Runtime} runtime - runtime properties
 */
function LocalStorageProvider(config,runtime) {
  this.config = config;
  this.runtime = runtime;

  this.currentSpec = null;
  this.localStoreBasePath = config.localBasePath;
}

/**
 * Return runtime path segment
 * @private
 * @return {string} runtime path segment, no front or trailing slashes
 */
StorageProvider.prototype._getRuntimePathSegment = function(){
  return [
    this.currentSpec.name,
    this.runtime.platformName,
    this.runtime.platformResolution,
    this.runtime.browserName,
    this.runtime.ui5.theme,
    this.runtime.ui5.direction,
    this.runtime.ui5.mode
  ].join('/');
};

//// API to comparisonProvider

/**
 * Return the ref image read stream
 * @param {string} refImageName - reference image name
 * @return {ReadStream} - read stream for the reference image content
 */
StorageProvider.prototype.readRefImage = function(refImageName){
  var refImagePath = [
    spec.testBasePath,
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment(),
    (refImageName + '.ref.png')
  ].join('/');
  return fs.createReadStream(refImagePath); // TODO error handling ?
};

/**
 * Returns the ref image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
StorageProvider.prototype.storeRefImage = function(refImageName){
  var refImagePath = [
    spec.testBasePath,
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment(),
    (refImageName + '.ref.png')
  ].join('/');
  return fs.createWriteStream(refImagePath); // TODO error handling ?
};

/**
 * Returns the act image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
StorageProvider.prototype.storeActImage = function(refImageName){
  var refImagePath = [
    this.localStoreBasePath, // c:\work\openui5\dist
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment(),
    (refImageName + '.act.png')
  ].join('/');
  return fs.createWriteStream(refImagePath); // TODO error handling ?
};

/**
 * Returns the diff image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the diff image content
 */
StorageProvider.prototype.storeDiffImage = function(refImageName){
  var diffImagePath = [
    this.localStoreBasePath, // c:\work\openui5\dist
    'images',
    this._getRuntimePathSegment(),
    (refImageName + '.diff.png')
  ].join('/');
  return fs.createWriteStream(refImagePath);
};

/**
 * Hook, called before each spec
 * @param {Spec} spec - spec
 *
 * Used to store current spec
 */
StorageProvider.prototype.onBeforeEachSpec = function(spec){
  this.currentSpec = spec;
};
