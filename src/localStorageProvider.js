var fs = require('fs');

var DEFAULT_LOCAL_BASE_PATH = 'target/images';
var DEFAULT_REF_IMAGE_EXT = '.ref.png';
var DEFAULT_ACT_IMAGE_EXT = '.act.png';
var DEFAULT_DIFF_IMAGE_EXT = '.diff.png';

/**
 * @typedef LocalStorageProviderConfig
 * @type {Object}
 * @extends {StorageProviderConfig}
 * @property {string} localStorageProvider.localBasePath - local storage base path e.g. c:\openui5\target\images
 */

/**
 * Stores and loads images from local git structure
 * @constructor
 * @implements {StorageProvider}
 * @param {LocalStorageProviderConfig} config
 * @param {Logger} logger
 * @param {Runtime} runtime - runtime properties
 */
function LocalStorageProvider(config, logger, runtime) {
  this.config = config;
  this.logger = logger;
  this.runtime = runtime;

  this.currentSpec = null;
  this.localBasePath = this.config.localStorageProvider ?
    config.localStorageProvider.localBasePath || DEFAULT_LOCAL_BASE_PATH : DEFAULT_LOCAL_BASE_PATH;
}

//// API to comparisonProvider

/**
 * Return the ref image read stream
 * @param {string} refImageName - reference image name
 * @return {ReadStream} - read stream for the reference image content
 */
LocalStorageProvider.prototype.readRefImage = function(refImageName){
  var refImagePath = [
    this.currentSpec.testBasePath,
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment(),
    (refImageName + DEFAULT_REF_IMAGE_EXT)
  ].join('/');
  return fs.createReadStream(refImagePath); // TODO error handling ?
};

/**
 * Returns the ref image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
LocalStorageProvider.prototype.storeRefImage = function(refImageName){
  var refImageBasePath = [
    this.currentSpec.testBasePath,
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment()
  ].join('/');
  this._mkdirs(refImageBasePath);
  return fs.createWriteStream(refImageBasePath + '/' + refImageName + DEFAULT_REF_IMAGE_EXT);
};

/**
 * Returns the act image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the ref image content
 */
LocalStorageProvider.prototype.storeActImage = function(refImageName){
  var actImageBasePath = [
    this.localBasePath,
    this._getRuntimePathSegment()
  ].join('/');
  this._mkdirs(actImageBasePath);
  return fs.createWriteStream(actImageBasePath + '/' + refImageName + DEFAULT_ACT_IMAGE_EXT);
};

/**
 * Returns the diff image write stream
 * @param {string} refImageName  - reference image name
 * @return {WriteStream} - write stream to pipe the diff image content
 */
LocalStorageProvider.prototype.storeDiffImage = function(refImageName){
  var diffImageBasePath = [
    this.localBasePath,
    this._getRuntimePathSegment()
  ].join('/');
  this._mkdirs(diffImageBasePath);
  return fs.createWriteStream(diffImageBasePath + '/' + refImageName + DEFAULT_DIFF_IMAGE_EXT);
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
 * Makes directory from given path and root
 * @param {String} path - string of directory path
 * @param {String} [root] - optional string for directory root
 * */
LocalStorageProvider.prototype._mkdirs = function (path, root) {
  var dirs = path.split('/'), dir = dirs.shift(), root = (root || '') + dir + '/';

  try {
    fs.mkdirSync(root);
  } catch (e) {
    //dir wasn't made, something went wrong
    if (!fs.statSync(root).isDirectory()) throw new Error("Folder cannot be created: " + e);
  }

  return !dirs.length || this._mkdirs(dirs.join('/'), root);
};

/**
 * Hook, called before each spec
 * @param {Spec} spec - spec
 *
 * Used to store current spec
 */
LocalStorageProvider.prototype.onBeforeEachSpec = function(spec){
  this.currentSpec = spec;
};

module.exports = function(config, logger, runtime){
  return new LocalStorageProvider(config, logger, runtime);
};

