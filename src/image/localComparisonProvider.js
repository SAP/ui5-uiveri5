
var _ = require('lodash');
var resemble = require('resemblejs-tolerance');
var webdriver = require('selenium-webdriver');
var Q = require('q');

//default values
var DEFAULT_COMPARE = true;
var DEFAULT_UPDATE = false;
var DEFAULT_THRESHOLD_PERCENTAGE = 0.1;
var DEFAULT_THRESHOLD_PIXELS = 200;

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
 * @property {boolean} ignoreColors - enable color ignore in comparison
 * @property {boolean} ignoreAntialiasing - enable antialiasing ignore while image comparison
 * @property {{red: {number}, green: {number}, blue: {number}}} errorColor - object with red, green and blue number value for defining color for diff pixels
 * @property {string} errorType - what type of error will expect (flat or movement)
 * @property {number) transparency - transparency intensity of the diff image
 * @property {[{x: {number}, y: {number}, width: {number}, height: {number}}]} ignoreRectangles - array of coords of rectangles which will be ignored in comparison
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
function LocalComparisonProvider(config,instanceConfig,logger,storageProvider) {
  //this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;

  this.storageProvider = storageProvider;
  this.thresholdPercentage = config.thresholdPercentage || DEFAULT_THRESHOLD_PERCENTAGE;
  this.thresholdPixels = config.thresholdPixels || DEFAULT_THRESHOLD_PIXELS;

  this.take = typeof config.take !== 'undefined' ? config.take : DEFAULT_COMPARE;
  this.compare = typeof config.compare !== 'undefined' ? config.compare : DEFAULT_COMPARE;
  this.update = typeof config.update !== 'undefined' ? config.update : DEFAULT_UPDATE;
}

/**
 * Registers the custom matcher to jasmine environment
 * @param {Object} matchers - jasmine matchers, adds toLookAs matcher here
 */
LocalComparisonProvider.prototype.register = function (matchers) {
  var that = this;

  // create jasmine custom matcher
  var toLookAs = function () {
    return {
      compare: function (actEncodedImage, expectedImageName) {

        // matcher returns result object
        var defer = webdriver.promise.defer();
        var result = {
          pass: defer
        };

        if(that.take && that.compare) {
          var actualImageBuffer = new Buffer(actEncodedImage, 'base64');

          // get the reference image from storage provider
          that.storageProvider.readRefImage(expectedImageName)
            .then(function (refImageResult) {
              resemble.outputSettings(that.instanceConfig);

              // compare two images and add input settings - they are chained and set to resJS object
              // settings include ignore colors, ignore antialiasing, threshold and ignore rectangle
              that.logger.debug('Comparing current screenshot to reference image: ' + expectedImageName);
              resemble(refImageResult.refImageBuffer).compareTo(actualImageBuffer).inputSettings(that.instanceConfig)
                .onComplete(function (comparisonResult) {

                  // remove error pixes to avoid trace clutter
                  var errorPixels = _.clone(comparisonResult.errorPixels);
                  delete comparisonResult.errorPixels;

                  // resolve mismatch percentage and count
                  var mismatchPercentage = parseFloat(comparisonResult.misMatchPercentage);
                  var mismatchPixelsCount = errorPixels.length;

                  // dimension difference is elevated to 100%
                  if (!comparisonResult.isSameDimensions) {
                    // TODO better error message
                    mismatchPercentage = 100;
                    mismatchPixelsCount = -1;
                  }

                  that.logger.trace('Image comparison done ' +
                  ',reference image: ${expectedImageName} ' +
                  ',results: ${JSON.stringify(comparisonResult)} ' +
                  ',error pixels: ${JSON.stringify(errorPixels)}', {
                    expectedImageName: expectedImageName,
                    comparisonResult: comparisonResult,
                    errorPixels: errorPixels
                  });

                  // resolve pixel threshold from the given threshold percentage
                  var allImagePixels = comparisonResult.getDiffImage().width * comparisonResult.getDiffImage().height;
                  var thresholdPixelsFromPercentage = (allImagePixels * that.thresholdPercentage) / 100;
                  var resolvedPixelThreshold = Math.min(thresholdPixelsFromPercentage, that.thresholdPixels);

                  // check the mismatch percentage and the mismatch pixel count
                  if (mismatchPixelsCount > -1 && mismatchPixelsCount < resolvedPixelThreshold) {
                    that.logger.debug('Image comparison passed, reference image: ' + expectedImageName +
                    ', difference in percentages: ' + mismatchPercentage + '% (threshold: ' + that.thresholdPercentage
                    + '%), difference in pixels: ' + mismatchPixelsCount + ' (threshold: ' + resolvedPixelThreshold
                    + ')');
                    result.message = JSON.stringify({
                      message: 'Image comparison passed, reference image: ' + expectedImageName +
                      ', difference in percentages: ' + mismatchPercentage + '% (threshold: ' + that.thresholdPercentage
                      + '%), difference in pixels: ' + mismatchPixelsCount + ' (threshold: ' + resolvedPixelThreshold
                      + ')',
                      details: {
                        refImageUrl: refImageResult.refImageUrl
                      }
                    });
                    // pass
                    defer.fulfill({message: result.message});
                  } else {
                    // handle image updates - no need to show error
                    if (that.update) {
                      that.logger.debug('Image comparison failed, updating reference image: ' + expectedImageName +
                      ' with the current screenshot');
                      var res = {
                        message: 'Image comparison failed, updating reference image: ' + expectedImageName +
                          ' with the current screenshot'
                      };

                      that.storageProvider.storeRefImage(expectedImageName,actualImageBuffer)
                        .then(function(refImageUrl){
                          // update details and store message
                          res.details = {
                            refImageUrl: refImageUrl
                          };
                          result.message = JSON.stringify(res);
                          // pass
                          defer.fulfill(true);
                        })
                        .catch(function(error){
                          result.message = error.stack;
                          //fail
                          defer.fulfill(false);
                        });
                    } else {
                      var resMessage;
                      if (mismatchPixelsCount == -1) {
                        that.logger.debug('Image comparison failed, reference image: ' + expectedImageName +
                          ', difference in image size with: W=' + comparisonResult.dimensionDifference.width +
                          'px, H=' + comparisonResult.dimensionDifference.height + 'px');
                        resMessage = 'Image comparison failed, reference image: ' + expectedImageName +
                          ', difference in image size with: W=' + comparisonResult.dimensionDifference.width +
                          'px, H=' + comparisonResult.dimensionDifference.height + 'px';
                      } else {
                        that.logger.debug('Image comparison failed, reference image: ' + expectedImageName +
                          ', difference in percentages: ' + mismatchPercentage + '% (threshold: ' + that.thresholdPercentage
                          + '%), difference in pixels: ' + mismatchPixelsCount + ' (threshold: ' + resolvedPixelThreshold
                          + ')');
                        resMessage = 'Image comparison failed, reference image: ' + expectedImageName +
                          ', difference in percentages: ' + mismatchPercentage + '% (threshold: '
                          + that.thresholdPercentage + '%), difference in pixels: ' + mismatchPixelsCount
                          + ' (threshold: ' + resolvedPixelThreshold + ')';
                      }

                      var res = {
                        message: resMessage,
                        details: {
                          refImageUrl: refImageResult.refImageUrl
                        }
                      };

                      // store actual image
                      var storeActPromise =
                        that.storageProvider.storeActImage(expectedImageName,actualImageBuffer)
                          .then(function(actImageUrl){
                            res.details.actImageUrl = actImageUrl;
                          });

                      // store diff image
                      var storeDiffPromise = Q.Promise(function(resolveFn,rejectFn){
                        var diffImageChunks = [];
                        var diffImageReadStream = comparisonResult.getDiffImage().pack();
                        diffImageReadStream.on('data', function (chunk) {
                          diffImageChunks.push(chunk);
                        });
                        diffImageReadStream.on('error', function(error) {
                          rejectFn(error);
                        });
                        diffImageReadStream.on('end', function () {
                          var diffImageBuffer = Buffer.concat(diffImageChunks);
                          that.storageProvider.storeDiffImage(expectedImageName,diffImageBuffer)
                            .then(function(diffImageUrl){
                              res.details.diffImageUrl = diffImageUrl;
                              resolveFn();
                            })
                            .catch(function(error){
                              rejectFn(error);
                            });
                        });

                      });

                      // wait for both promises and finish the match
                      Q.all([storeActPromise,storeDiffPromise])
                        .then(function(){
                          // add details
                          result.message = JSON.stringify(res);
                          // fail
                          defer.fulfill(false);
                        })
                        .catch(function(error){
                          result.message = error.stack;
                          // fail
                          defer.fulfill(false);
                        });
                    }
                  }
                });
              })
            .catch(function(error){
              if(that.update) {
                that.logger.debug('Image comparison enabled but no reference image found: ' + expectedImageName +
                ' ,update enabled so storing current as reference' );
                var res = {
                  message: 'Image comparison enabled but no reference image found: ' + expectedImageName +
                  ' ,update enabled so storing current as reference'
                };

                that.storageProvider.storeRefImage(expectedImageName,actualImageBuffer)
                  .then(function(refImageUrl){
                    // update details and store message
                    res.details = {refImageUrl:refImageUrl};
                    result.message = JSON.stringify(res);
                    //pass
                    defer.fulfill(true);
                  })
                  .catch(function(error){
                    result.message = error.stack;
                    // fail
                    defer.fulfill(false);
                  });
              } else {
                that.logger.debug('Image comparison enabled but no reference image found: ' + expectedImageName +
                ' ,update disabled');
                result.message = 'Image comparison enabled but no reference image found: ' + expectedImageName +
                ' ,update disabled';
                defer.fulfill(false);
              }
            });
        } else {
          that.logger.debug('Comparison or screenshot taking disabled so skipping comparison');
          result.message = 'Comparison or screenshot taking disabled so skipping comparison';

          // pass
          defer.fulfill(true);
        }

        return result;
      }
    }
  };

  matchers.toLookAs = toLookAs;
};

module.exports = function (config,instanceConfig,logger,storageProvider) {
  return new LocalComparisonProvider(config,instanceConfig,logger,storageProvider);
};
