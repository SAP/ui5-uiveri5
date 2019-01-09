
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var Q = require('q');

var IMAGE_PATH_PREFIX = 'images';
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
  this.logger.info('Reading ref image: ' + refImageName);

  var refImageUri = [
    IMAGE_PATH_PREFIX,
    this._getRuntimePathSegment(),
    (refImageName + DEFAULT_REF_IMAGE_EXT)
  ].join('/');
  var refImagePath = path.resolve(
    (this.refImagesRoot || this.currentSpecTestBasePath) + '/' + refImageUri).replace(/\\/g,'/');
  var refImageShowPath = this.refImagesShowRoot ?
    this.refImagesShowRoot + '/' + refImageUri : refImagePath;
  this.logger.debug('Reading ref image file: ' + refImagePath);

  return Q.Promise(function(resolveFn,rejectFn){
    fs.stat(refImagePath, function(err) {
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
  });
};

/**
 * Store new reference image
 * @param {string} imageName  - image name
 * @param {Buffer} refImageBuffer - actual image buffer, also stored as new reference image
 * @return {q.promise<{refImageUrl},{Error}>} - promise that resolves with image url
 */
LocalStorageProvider.prototype.storeRefImage = function(imageName,refImageBuffer) {
  var that = this;
  this.logger.info('Storing ref image: ' + imageName);

  return that._storeImage('REF',imageName,refImageBuffer)
    .then(function(url){
      return {
        refImageUrl: url
      };
    });
};

/**
 * Store new reference, actual and difference images
 * @param {string} imageName  - image name
 * @param {Buffer} actImageBuffer - actual image buffer, also stored as new reference image
 * @param {Buffer} diffImageBuffer - diff image buffer
 * @param {boolean} updateRefFlag - whether to update ref image
 * @return {q.promise<{refImageUrl,actImageUrl,diffImageUrl},{Error}>} - promise that resolves with images urls
 */
LocalStorageProvider.prototype.storeRefActDiffImage = function(imageName,actImageBuffer,diffImageBuffer,updateRefFlag) {
  var that = this;
  this.logger.debug('Storing ref,act and diff images: ' + imageName);

  return Q.all([
    updateRefFlag ? that._storeImage('REF',imageName,actImageBuffer) : Q(),
    that._storeImage('ACT',imageName,actImageBuffer),
    that._storeImage('DIFF',imageName,diffImageBuffer)
  ]).then(function(results){
    return {
      refImageUrl: results[0],
      actImageUrl: results[1],
      diffImageUrl: results[2]
    };
  });
};

LocalStorageProvider.prototype._storeImage = function(type,imageName,imageBuffer){
  var ext;
  if (type == 'REF') {
    ext = DEFAULT_REF_IMAGE_EXT;
  } else if (type == 'ACT') {
    ext = DEFAULT_ACT_IMAGE_EXT;
  } else if (type == 'DIFF') {
    ext = DEFAULT_DIFF_IMAGE_EXT;
  }

  var imageUri = [
    IMAGE_PATH_PREFIX,
    this._getRuntimePathSegment(),
    (imageName + ext)
  ].join('/');
  var imagePath = path.resolve((
    (type == 'REF' ? this.refImagesRoot : this.actImagesRoot )
    || this.currentSpecTestBasePath) + '/' + imageUri).replace(/\\/g,'/');
  mkdirp.sync(imagePath.substring(0,imagePath.lastIndexOf('/')));
  this.logger.debug('Storing image file: ' + imagePath);

  var imagesShowRoot = type == 'REF' ? this.refImagesShowRoot : this.actImagesShowRoot;
  var imageShowPath = imagesShowRoot ?
    imagesShowRoot + '/' + imageUri : imagePath;

  var imageWriteStream = fs.createWriteStream(imagePath);
  return Q.ninvoke(imageWriteStream,'write',imageBuffer)
    .then(function(){
      return imageShowPath;
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
