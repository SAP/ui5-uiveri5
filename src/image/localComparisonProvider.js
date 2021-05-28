var resemble = require('./../../lib/resemblejs/resemble');
var webdriver = require('selenium-webdriver');
var Q = require('q');

//default values
var DEFAULT_COMPARE = true;
var DEFAULT_UPDATE = false;
var DEFAULT_IGNORE_NOTHING = true;
var DEFAULT_THRESHOLD_PERCENTAGE = 0.1;
var DEFAULT_THRESHOLD_PIXELS = 200;
var DEFAULT_IMAGE_NAME_REGEX = /^[\w\-]{3,40}$/;

/**
 * @typedef LocalComparisonProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 * @property {boolean} compare - enable screenshot comparison
 * @property {boolean} update - enable reference image update
 */

/**
 * @typedef LocalComparisonProviderInstanceConfig
 * @type {Object}
 * @property {{red: {number}, green: {number}, blue: {number}}} errorColor - object with red, green and blue number value for defining color for diff pixels
 * @property {string} errorType - what type of error will expect (flat or movement)
 * @property {number) thresholdPercentage - threshold image difference, in % to fail the comparison
 * @property {number) thresholdPixels - threshold image difference, in wrong pixels count to fail the comparison
 */

/**
 * @constructor
 * @implements {ComparisonProvider}
 * @param {LocalComparisonProviderConfig} config
 * @param {LocalComparisonProviderInstanceConfig} instanceConfig
 * @param {Logger} logger
 * @param {StorageProvider} storage provider
 */
function LocalComparisonProvider(config, instanceConfig, logger, storageProvider) {
  //this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;

  this.storageProvider = storageProvider;
  this.thresholdPercentage = config.thresholdPercentage || DEFAULT_THRESHOLD_PERCENTAGE;
  this.thresholdPixels = config.thresholdPixels || DEFAULT_THRESHOLD_PIXELS;
  this.imgNameRegEx = config.imgNameRegEx || DEFAULT_IMAGE_NAME_REGEX;
  this.ignoreNothing = typeof config.ignoreNothing !== 'undefined' ? config.ignoreNothing : DEFAULT_IGNORE_NOTHING;

  this.take = typeof config.take !== 'undefined' ? config.take : DEFAULT_COMPARE;
  this.compare = typeof config.compare !== 'undefined' ? config.compare : DEFAULT_COMPARE;
  this.update = typeof config.update !== 'undefined' ? config.update : DEFAULT_UPDATE;
}

/**
 * Registers the custom matcher to jasmine environment
 */
LocalComparisonProvider.prototype.register = function () {
  jasmine.getEnv().addMatchers([this.getMatchers()]);
};

LocalComparisonProvider.prototype.getMatchers = function () {
  return {
    toLookAs: function () {
      return {
        compare: this._compare.bind(this)
      };
    }.bind(this)
  };
};

LocalComparisonProvider.prototype._compare = function (actEncodedImage, expectedImageName) {
  // matcher returns result object
  var defer = webdriver.promise.defer();
  var result = {
    pass: defer.promise
  };
  var that = this;

  if (!expectedImageName.match(that.imgNameRegEx)) {
    result.message = 'The image name is not correct! Image name: ' + expectedImageName + ' ; length: '
      + expectedImageName.length + '. ';

    that.logger.debug(result.message + 'RegExp: ' + that.imgNameRegEx);

    if (that.imgNameRegEx === DEFAULT_IMAGE_NAME_REGEX) {
      result.message += 'Image name should be between 3 and 40 characters and contain only: A-Za-z0-9_-';
    } else {
      result.message += 'Image name regExp: ' + that.imgNameRegEx;
    }

    defer.fulfill(false);
  } else if (that.take && that.compare) {
    var actualImageBuffer = new Buffer(actEncodedImage, 'base64');

    // get the reference image from storage provider
    that.storageProvider.readRefImage(expectedImageName).then(function (refImageResult) {
      // check if reference image was found
      if (refImageResult == null) {
        var msg = 'Image comparison enabled but no reference image found: '
          + expectedImageName;

        if (that.update) {
          msg += ' ,update enabled so storing current as reference';
          // reference image was not found => either update or throw error
          that.logger.debug(msg);
          var res = {
            message: msg,
            imageName: expectedImageName,
            failureType: 'COMPARISON'
          };

          that.storageProvider.storeRefImage(expectedImageName, actualImageBuffer)
            .then(function (refRes) {
              // update details and store message
              res.details = {
                refImageUrl: refRes.refImageUrl
              };
              result.message = JSON.stringify(res);
              // fail
              defer.fulfill(false);
            })
            .catch(function (error) {
              result.message = error.stack;
              // fail
              defer.fulfill(false);
            });
        } else {
          msg += ' ,update disabled';
          that.logger.debug(msg);
          result.message = msg;

          // fail
          defer.fulfill(false);
        }
      } else {
        // reference image was found => compare it against actual
        resemble.outputSettings(that.instanceConfig);

        // compare two images and add input settings - they are chained and set to resJS object
        // settings include ignore colors, ignore antialiasing, threshold and ignore rectangle
        that.logger.debug('Comparing current screenshot to reference image: ' + expectedImageName);
        var resComparison = resemble(refImageResult.refImageBuffer).compareTo(actualImageBuffer);
        if (that.ignoreNothing) {
          resComparison.ignoreNothing(that.ignoreNothing);
        }

        resComparison.onComplete(function (comparisonResult, error) {
          if (error) {
            result.message = 'Image comparison failed, error: ' + error;
            that.logger.debug(result.message);
            defer.fulfill(false);
            return;
          }
          // resolve mismatch percentage and count
          var mismatchPercentage = parseFloat(comparisonResult.misMatchPercentage);
          var mismatchPixelsCount = comparisonResult.mismatchCount;

          // dimension difference is elevated to 100%
          if (!comparisonResult.isSameDimensions) {
            mismatchPercentage = 100;
            mismatchPixelsCount = -1;
          }

          that.logger.trace('Image comparison done ' +
            ',reference image: ${expectedImageName} ' +
            ',results: ${JSON.stringify(comparisonResult)} ', {
            expectedImageName: expectedImageName,
            comparisonResult: comparisonResult
          });

          // resolve pixel threshold from the given threshold percentage
          var allImagePixels = comparisonResult.getDiffImage().width * comparisonResult.getDiffImage().height;
          var thresholdPixelsFromPercentage = (allImagePixels * that.thresholdPercentage) / 100;
          var resolvedPixelThreshold = Math.min(thresholdPixelsFromPercentage, that.thresholdPixels);
          var msg;

          // check the mismatch percentage and the mismatch pixel count
          if (mismatchPixelsCount > -1 && mismatchPixelsCount < resolvedPixelThreshold) {
            msg = 'Image comparison passed, reference image: ' + expectedImageName +
              ', difference in percentages: ' + mismatchPercentage + '% (threshold: ' + that.thresholdPercentage
              + '%), difference in pixels: ' + mismatchPixelsCount + ' (threshold: ' + resolvedPixelThreshold
              + ')';
            that.logger.debug(msg);
            result.message = JSON.stringify({
              message: msg,
              details: {
                refImageUrl: refImageResult.refImageUrl
              },
              imageName: expectedImageName
            });
            // pass
            defer.fulfill({ message: result.message });
          } else {
            if (mismatchPixelsCount == -1) {
              msg = 'Image comparison failed, reference image: ' + expectedImageName +
                ', difference in image size with: W=' + comparisonResult.dimensionDifference.width +
                'px, H=' + comparisonResult.dimensionDifference.height + 'px';
            } else {
              msg = 'Image comparison failed, reference image: ' + expectedImageName +
                ', difference in percentages: ' + mismatchPercentage + '% (threshold: '
                + that.thresholdPercentage + '%), difference in pixels: ' + mismatchPixelsCount
                + ' (threshold: ' + resolvedPixelThreshold + ')';
            }

            // handle image updates
            if (that.update) {
              msg += ' ,update enabled so storing current as reference';
            } else {
              msg += ' ,update disabled';
            }
            that.logger.debug(msg);
            var res = {
              message: msg,
              details: {
                refImageUrl: refImageResult.refImageUrl
              },
              imageName: expectedImageName
            };

            that._diffImageToBuffer(comparisonResult).then(function (diffImageBuffer) {
              return that.storageProvider.storeRefActDiffImage(
                expectedImageName, actualImageBuffer, diffImageBuffer, that.update);
            }).then(function (storeRes) {
              // ref should be left the ref image before update
              res.details.actImageUrl = storeRes.actImageUrl;
              res.details.diffImageUrl = storeRes.diffImageUrl;
              res.failureType = 'COMPARISON';
              result.message = JSON.stringify(res);
              // fail
              defer.fulfill(false);
            })
              .catch(function (error) {
                result.message = error.stack;
                // fail
                defer.fulfill(false);
              });
          }
        });
      }
    }).catch(function (error) {
      result.message = error.stack;
      // fail
      defer.fulfill(false);
    });
  } else {
    var msg = 'Comparison or screenshot taking disabled so skipping comparison';
    that.logger.debug(msg);
    result.message = msg;

    // pass
    defer.fulfill({ message: result.message });
  }

  return result;
};

LocalComparisonProvider.prototype._diffImageToBuffer = function (comparisonResult) {
  return Q.Promise(function (resolveFn, rejectFn) {
    var diffImageChunks = [];
    var diffImageReadStream = comparisonResult.getDiffImage().pack();
    diffImageReadStream.on('data', function (chunk) {
      diffImageChunks.push(chunk);
    });
    diffImageReadStream.on('error', function (error) {
      rejectFn(error);
    });
    diffImageReadStream.on('end', function () {
      var diffImageBuffer = Buffer.concat(diffImageChunks);
      resolveFn(diffImageBuffer);
    });
  });
};

module.exports = function (config, instanceConfig, logger, storageProvider) {
  return new LocalComparisonProvider(config, instanceConfig, logger, storageProvider);
};
