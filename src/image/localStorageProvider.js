
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var Q = require('q');

var IMAGE_PATH_PREFIX = 'images'; // TODO consider if this level is really necessary
var DEFAULT_ACT_IMAGES_ROOT = 'target';
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
 * @property {string} actImagesRoot - actual and diff images root, defaults to: target
 * @property {string} refImagesRoot - reference images root, defaults to spec.testBasePath
 * @property {string} actImagesShowRoot - act images external root, default to actImagesRoot value
 * @property {string} refImagesShowRoot - ref images external root, default to refImagesRoot value
 */

/**
 * Stores and loads images from local git structure
 * @constructor
 * @implements {StorageProvider}
 * @param {LocalStorageProviderConfig}
 * @param {LocalStorageProviderInstanceConfig}
 * @param {Logger} logger
 * @param {Runtime} runtime
 */
function LocalStorageProvider(config,instanceConfig,logger,runtime) {
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.runtime = runtime;

  this.actImagesRoot = instanceConfig.actImagesRoot || DEFAULT_ACT_IMAGES_ROOT;
  this.refImagesRoot = instanceConfig.refImagesRoot;
  this.actImagesShowRoot = instanceConfig.actImagesShowRoot;
  this.refImagesShowRoot = instanceConfig.refImagesShowRoot;

  this.currentSpecName = null;
  this.currentSpecTestBasePath = null;
}

//// API to comparisonProvider

/**
 * Read ref image
 * @param {string} refImageName - reference image name
 * @return {q.promise<{refImageBuffer:Buffer,refImageUrl:string},{Error}>} - promise that resolves with data and image url
 */
LocalStorageProvider.prototype.readRefImage = function(refImageName){
  var refImageUri = [
    IMAGE_PATH_PREFIX,
    this._getRuntimePathSegment(),
    (refImageName + DEFAULT_REF_IMAGE_EXT)
  ].join('/');
  var refImagePath = path.resolve(
    (this.refImagesRoot || this.currentSpecTestBasePath) + '/' + refImageUri).replace(/\\/g,'/');
  var refImageShowPath = this.refImagesShowRoot ?
    this.refImagesShowRoot + '/' + refImageUri : refImagePath;
  this.logger.debug('Reading reference image: ' + refImagePath);

  return Q.Promise(function(resolveFn,rejectFn){
    fs.stat(refImagePath, function(err, stats) {
      if (err) {
        // no such file => return no ref image
        resolveFn(null);
      } else {
        var dataRefImage = [];
        fs.createReadStream(refImagePath)
          .on('error', function(error) {
            rejectFn(new Error('Error while reading: ' + refImagePath + ' ,details: '  + error));
          })
          .on('data', function(chunk) {
            dataRefImage.push(chunk);
          })
          .on('end', function() {
            resolveFn({
              refImageBuffer: Buffer.concat(dataRefImage),
              refImageUrl: refImageShowPath
            });
          });
      }
    });
  })
};

/**
 * Store new ref image
 * @param {string} refImageName  - reference image name
 * @param {Buffer} refImageBuffer - reference image buffer
 * @return {q.promise<{refImageUrl:Buffer},{Error}>} - promise that resolves with ref image url
 */
LocalStorageProvider.prototype.storeRefImage = function(refImageName,refImageBuffer){
  var refImageUri = [
    IMAGE_PATH_PREFIX,
    this._getRuntimePathSegment(),
    (refImageName + DEFAULT_REF_IMAGE_EXT)
  ].join('/');
  var refImagePath = path.resolve(
    (this.refImagesRoot || this.currentSpecTestBasePath) + '/' + refImageUri).replace(/\\/g,'/');
  mkdirp.sync(refImagePath.substring(0,refImagePath.lastIndexOf('/')));
  var refImageShowPath = this.refImagesShowRoot ?
    this.refImagesShowRoot + '/' + refImageUri : refImagePath;
  this.logger.debug('Storing reference image: ' + refImagePath);

  var refImageWriteStream = fs.createWriteStream(refImagePath);
  return Q.ninvoke(refImageWriteStream,'write',refImageBuffer)
    .then(function(){
      return refImageShowPath;
    });
};

/**
 * Store new act image
 * @param {string} actImageName  - act image name
 * @param {Buffer} actImageBuffer - actual image buffer
 * @return {q.promise<{actImageUrl},{Error}>} - promise that resolves with act image url
 */
LocalStorageProvider.prototype.storeActImage = function(actImageName,actImageBuffer){
  var actImageUri = [
    IMAGE_PATH_PREFIX,
    this._getRuntimePathSegment(),
    (actImageName + DEFAULT_ACT_IMAGE_EXT)
  ].join('/');
  var actImagePath = path.resolve(
    this.actImagesRoot + '/' + actImageUri).replace(/\\/g,'/');
  mkdirp.sync(actImagePath.substring(0,actImagePath.lastIndexOf('/')));
  var actImageShowPath = this.actImagesShowRoot ?
    this.actImagesShowRoot + '/' + actImageUri : actImagePath;
  this.logger.debug('Storing actual image: ' + actImagePath);

  //return fs.createWriteStream(actImagePath);
  var actImageWriteStream = fs.createWriteStream(actImagePath);
  return Q.ninvoke(actImageWriteStream,'write',actImageBuffer)
    .then(function(){
      return actImageShowPath;
    });
};

/**
 * Store new diff image
 * @param {string} diffImageName  - diff image name
 * @param {Buffer} diffImageBuffer - diff image buffer
 * @return {q.promise<{diffImageUrl},{Error}>} - promise that resolves with diff image url
 */
LocalStorageProvider.prototype.storeDiffImage = function(diffImageName,diffImageBuffer){
  var diffImageUri = [
    IMAGE_PATH_PREFIX,
    this._getRuntimePathSegment(),
    (diffImageName + DEFAULT_DIFF_IMAGE_EXT)
  ].join('/');
  var diffImagePath = path.resolve(
    this.actImagesRoot + '/' + diffImageUri).replace(/\\/g,'/');
  mkdirp.sync(diffImagePath.substring(0,diffImagePath.lastIndexOf('/')));
  var diffImageShowPath = this.actImagesShowRoot ?
    this.actImagesShowRoot + '/' + diffImageUri : diffImagePath;
  this.logger.debug('Storing diff image: ' + diffImagePath);

  //return fs.createWriteStream(diffImagePath);
  var diffImageWriteStream = fs.createWriteStream(diffImagePath);
  return Q.ninvoke(diffImageWriteStream,'write',diffImageBuffer)
    .then(function(){
      return diffImageShowPath;
    });
};

/**
 * Return runtime path segment
 * @private
 * @return {string} runtime path segment, no front or trailing slashes
 */
LocalStorageProvider.prototype._getRuntimePathSegment = function(){
  return [
    this.currentSpecName,
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
  this.logger.debug('Init localStorageProvider with spec: ' + spec.fullName);

  this.currentSpecName = spec.name;
  this.currentSpecTestBasePath = spec.testPath.substring(0,spec.testPath.lastIndexOf('/'));
};

module.exports = function(config,instanceConfig,logger,runtime){
  return new LocalStorageProvider(config,instanceConfig,logger,runtime);
};
