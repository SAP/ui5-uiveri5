
var fs = require('fs');
var mkdirp = require('mkdirp');

var DEFAULT_ACT_IMAGES_ROOT = 'target/images';
var DEFAULT_REF_IMAGE_EXT = '.ref.png';
var DEFAULT_ACT_IMAGE_EXT = '.act.png';
var DEFAULT_DIFF_IMAGE_EXT = '.diff.png';

/**
 * @typedef LocalStorageProviderConfig
 * @type {Object}
 * @extends {Config}
 */

/**
 * @typedef LocalStorageProviderInstanceConfig
 * @type {Object}
 * @property {string} actImagesRoot - actual and diff images root, defaults to: target/images
 * @property {string} refImagesRoot - reference images root, defaults to spec.testBasePath
 */

/**
 * Stores and loads images from local git structure
 * @constructor
 * @implements {StorageProvider}
 * @param {LocalStorageProviderConfig} config
 * @param {LocalStorageProviderInstanceConfig} instanceConfig
 * @param {Logger} logger
 * @param {Runtime} runtime - runtime properties
 */
function LocalStorageProvider(config,instanceConfig,logger,runtime) {
  this.config = config;
  this.logger = logger;
  this.instanceConfig = instanceConfig;
  this.runtime = runtime;

  this.actImagesRoot = instanceConfig.actImagesRoot || DEFAULT_ACT_IMAGES_ROOT;
  this.refImagesRoot = instanceConfig.refImagesRoot;

  this.currentSpec = null;
}

//// API to comparisonProvider

/**
 * Return the ref image read stream
 * @param {string} refImageName - reference image name
 * @return {ReadStream} - read stream for the reference image content
 */
LocalStorageProvider.prototype.readRefImage = function(refImageName){
  var refImagePath = [
    this.refImagesRoot || this.currentSpec.testBasePath,
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment(),
    (refImageName + DEFAULT_REF_IMAGE_EXT)
  ].join('/');
  this.logger.debug('Reading reference image: ' + refImagePath);
  return fs.createReadStream(refImagePath); // TODO error handling ?
};

/**
 * Returns the ref image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
LocalStorageProvider.prototype.storeRefImage = function(refImageName){
  var refImagePath = [
    this.refImagesRoot || this.currentSpec.testBasePath,
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment()
  ].join('/');
  mkdirp.sync(refImagePath);
  refImagePath += '/' + refImageName + DEFAULT_REF_IMAGE_EXT;
  this.logger.debug('Store reference image: ' + refImagePath);
  return fs.createWriteStream(refImagePath);
};

/**
 * Returns the act image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
LocalStorageProvider.prototype.storeActImage = function(refImageName){
  var actImagePath = [
    this.actImagesRoot,
    this._getRuntimePathSegment()
  ].join('/');
  mkdirp.sync(actImagePath);
  actImagePath += '/' + refImageName + DEFAULT_ACT_IMAGE_EXT;
  this.logger.debug('Storing actual image: ' + actImagePath);
  return fs.createWriteStream(actImagePath);
};

/**
 * Returns the diff image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the diff image content
 */
LocalStorageProvider.prototype.storeDiffImage = function(refImageName){
  var diffImagePath = [
    this.actImagesRoot,
    this._getRuntimePathSegment()
  ].join('/');
  mkdirp.sync(diffImagePath);
  diffImagePath += '/' + refImageName + DEFAULT_DIFF_IMAGE_EXT;
  this.logger.debug('Storing diff image: ' + diffImagePath);
  return fs.createWriteStream(diffImagePath);
};

/**
 * Return runtime path segment
 * @private
 * @return {string} runtime path segment, no front or trailing slashes
 */
LocalStorageProvider.prototype._getRuntimePathSegment = function(){
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

/**
 * Hook, called before each spec
 * @param {Spec} spec - spec
 *
 * Used to store current spec
 */
LocalStorageProvider.prototype.onBeforeEachSpec = function(spec){
  this.currentSpec = spec;

  this.logger.debug('Init localStorageProvider with spec: ' + spec.fullName);
};

module.exports = function(config,instanceConfig,logger,runtime){
  return new LocalStorageProvider(config,instanceConfig,logger,runtime);
};
