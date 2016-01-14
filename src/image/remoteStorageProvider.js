var mkdirp = require('mkdirp')
var path = require('path');
var Q = require('q');
var request = require('request');
var _ = require('lodash');
var fs = require('fs');

var DEFAULT_IMAGE_STORAGE_URI = 'https://testimagestorageui5delivery.neo.ondemand.com/ImageStorage/images/';

var DEFAULT_REF_LNK_EXT = '.ref.lnk';
var DEFAULT_ACT_LNK_EXT = '.act.lnk';
var DEFAULT_DIFF_LNK_EXT = '.diff.lnk';

var DEFAULT_REF_IMAGE_EXT = '.ref.png';
var DEFAULT_ACT_IMAGE_EXT = '.act.png';
var DEFAULT_DIFF_IMAGE_EXT = '.diff.png';

/**
 * @typedef RemoteStorageProviderConfig
 * @type {Object}
 * @extends {Config}
 */

/**
 * @typedef RemoteStorageProviderInstanceConfig
 * @type {Object}
 * @property {string} refImagesRoot - reference images root, defaults to spec.testBasePath
 * @property {string} imageStorageUrl - url to the image storage application
 */

/**
 * Stores and loads images from local git structure
 * @constructor
 * @implements {StorageProvider}
 * @param {RemoteStorageProviderConfig}
 * @param {RemoteStorageProviderInstanceConfig}
 * @param {Logger} logger
 * @param {Runtime} runtime
 */
function RemoteStorageProvider(config,instanceConfig,logger,runtime) {
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.runtime = runtime;

  this.refImagesRoot = instanceConfig.refImagesRoot;
  this.imageStorageUrl = instanceConfig.imageStorageUrl || DEFAULT_IMAGE_STORAGE_URI;

  this.username = instanceConfig.username;
  this.password = instanceConfig.password;
  this.currentSpecName = null;
  this.currentSpecTestBasePath = null;
}

/**
 * Read ref image
 * @param {string} refImageName - reference image name
 * @return {q.promise<{refImageBuffer:Buffer,refImageUrl:string},{Error}>} - promise that resolves with data and image url
 */
RemoteStorageProvider.prototype.readRefImage = function(refImageName){
  var refImagePath = this._getRefPath(DEFAULT_REF_LNK_EXT, refImageName);
  var that = this;

  return Q.Promise(function(resolveFn,rejectFn) {
    fs.readFile(refImagePath, function(err, data) {
      if(err) {
        rejectFn(err);
      } else {
        var uuid = data.toString('utf8').match(/(uuid)+\W+(\S+)/)[2];
        var refImageUrl = that.imageStorageUrl + uuid;
        request({url: refImageUrl, auth: {user: that.username, pass: that.password},
          encoding: 'binary'}, function (error, response, body) {
            if(error) {
              rejectFn(error);
            } else {
              response.setEncoding()
              resolveFn({
                refImageBuffer: new Buffer(body, 'binary'),
                refImageUrl: refImageUrl
              });
            }
          });
      }
    });
  });
};

/**
 * Store new ref image
 * @param {string} refImageName  - reference image name
 * @param {Buffer} refImageBuffer - reference image buffer
 * @return {q.promise<{refImageUrl:Buffer},{Error}>} - promise that resolves with ref image url
 */
RemoteStorageProvider.prototype.storeRefImage = function(refImageName,refImageBuffer){
  this.logger.debug('Storing reference image: ' + refImageName);
  this.meta._meta.type = 'REF';

  var that = this;

  var formData = {
    "image": {
      value: refImageBuffer,
      options: {
        filename: refImageName + DEFAULT_REF_IMAGE_EXT
      }
    },
    "json" :  new Buffer(JSON.stringify(this.meta))
  };

  return Q.Promise(function(resolveFn,rejectFn) {
    request.post({url: that.imageStorageUrl, formData: formData,
      auth: {user: that.username, pass: that.password}},
      function (error, response, body) {
        if (error) {
          rejectFn(error);
        } else {
          var responseBody = JSON.parse(body);
          var refImageUrl = that.imageStorageUrl + responseBody.uuid;

          if(response.statusCode === 201 || response.statusCode === 422) {
            that._storeLnkFile(DEFAULT_REF_LNK_EXT, refImageName, responseBody.uuid).then(function() {
              resolveFn(refImageUrl);
            });
          } else {
            rejectFn(new Error('Server responded with status code: ' + response.statusCode));
          }
        }
      });
  });
};

/**
 * Store new act image
 * @param {string} actImageName  - act image name
 * @param {Buffer} actImageBuffer - actual image buffer
 * @return {q.promise<{actImageUrl},{Error}>} - promise that resolves with act image url
 */
RemoteStorageProvider.prototype.storeActImage = function(actImageName,actImageBuffer){
  this.logger.debug('Storing actual image: ' + actImageName);
  this.meta._meta.type = 'ACT';

  var that = this;
  var metaJson = JSON.stringify(this.meta);

  var formData = {
    "image": {
      value: actImageBuffer,
      options: {
        filename: actImageName + DEFAULT_ACT_IMAGE_EXT
      }
    },
    "json" : new Buffer(metaJson)
  };

  return Q.Promise(function(resolveFn,rejectFn) {
    request.post({url: that.imageStorageUrl, formData: formData,
      auth: {user: that.username, pass: that.password}},
      function (error, response, body) {
        if (error) {
          rejectFn(error);
        } else {
          var responseBody = JSON.parse(body);
          var actImageUrl = that.imageStorageUrl + responseBody.uuid;

          if(response.statusCode === 201 || response.statusCode === 422) {
            that._storeLnkFile(DEFAULT_ACT_LNK_EXT, actImageName, responseBody.uuid).then(function() {
              resolveFn(actImageUrl);
            });
          } else {
            rejectFn('Server responded with status code: ' + response.statusCode);
          }
        }
      });
  });
};

/**
 * Store new diff image
 * @param {string} diffImageName  - diff image name
 * @param {Buffer} diffImageBuffer - diff image buffer
 * @return {q.promise<{diffImageUrl},{Error}>} - promise that resolves with diff image url
 */
RemoteStorageProvider.prototype.storeDiffImage = function(diffImageName,diffImageBuffer){
  this.logger.debug('Storing actual image: ' + diffImageName);
  this.meta._meta.type = 'DIFF';

  var that = this;
  var metaJson = JSON.stringify(this.meta);

  var formData = {
    "image": {
      value: diffImageBuffer,
      options: {
        filename: diffImageName + DEFAULT_DIFF_IMAGE_EXT
      }
    },
    "json" : new Buffer(metaJson)
  };

  return Q.Promise(function(resolveFn,rejectFn) {
    request.post({url: that.imageStorageUrl, formData: formData,
      auth: {user: that.username, pass: that.password}},
      function (error, response, body) {
        if (error) {
          rejectFn(error);
        } else {
          var responseBody = JSON.parse(body);
          var diffImageUrl = that.imageStorageUrl + responseBody.uuid;

          if(response.statusCode === 201 || response.statusCode === 422) {
            that._storeLnkFile(DEFAULT_DIFF_LNK_EXT, diffImageName, responseBody.uuid).then(function() {
              resolveFn(diffImageUrl);
            });
          } else {
            rejectFn('Server responded with status code: ' + response.statusCode);
          }
        }
      });
  });
};

RemoteStorageProvider.prototype._storeLnkFile = function(ext, imageName, uuid) {
  var getDirName = path.dirname;
  var that = this;
  var refFilePath = that._getRefPath(ext, imageName);


  return Q.Promise(function(resolveFn,rejectFn) {
    mkdirp(getDirName(refFilePath), function (err) {
      if(err) {
        rejectFn(err);
      } else {
        fs.writeFile(refFilePath, 'uuid=' + uuid, function (error) {
          if (error) {
            rejectFn(error);
          } else {
            resolveFn();
          }
        });
      }
    })
  });
};

RemoteStorageProvider.prototype._getRefPath = function(extension, refFileName) {
  var refImagePath = [
    this.refImagesRoot || this.currentSpecTestBasePath,
    'images',           // TODO consider if this level is really necessary
    this._getRuntimePathSegment(),
    (refFileName + extension)
  ].join('/');

  return path.resolve(refImagePath).replace(/\\/g,'/');
};

RemoteStorageProvider.prototype._getRuntimePathSegment = function(){
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
RemoteStorageProvider.prototype.onBeforeEachSpec = function(spec){
  this.logger.debug('Init remoteStorageProvider with spec: ' + spec.fullName);

  this.currentSpecName = spec.name;
  this.currentSpecTestBasePath = spec.testPath.substring(0,spec.testPath.lastIndexOf('/'));

  this.meta = {
    _meta : {
      type: '',
      spec: {
        lib: spec.lib,
        name: spec.name,
        branch: spec.branch
      }
    }
  };

  this.meta._meta.runtime = _.clone(this.runtime, true);
};

module.exports = function(config,instanceConfig,logger,runtime){
  return new RemoteStorageProvider(config,instanceConfig,logger,runtime);
};
