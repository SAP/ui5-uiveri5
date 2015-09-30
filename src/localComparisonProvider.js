/**
 * Created by I304310 on 6/15/2015.
 */
'use strict';

var _ = require('lodash');
var resemble = require('resemblejs-tolerance');

//default values
var DEFAULT_COMPARE = true;
var DEFAULT_UPDATE = false;
var DEFAULT_THRESHOLD_PERCENTAGE = 1;

/**
 * @typedef LocalComparisonProviderConfig
 * @type {Object}
 * @extends {ComparisonProviderConfig}
 * @property {boolean} compare - enable screenshot comparison
 * @property {boolean} localComparisonProvider.ignoreColors - enable color ignore in comparison
 * @property {boolean} localComparisonProvider.ignoreAntialiasing - enable antialiasing ignore while image comparison
 * @property {{red: {number}, green: {number}, blue: {number}}} localComparisonProvider.errorColor - object with red, green and blue number value for defining color for diff pixels
 * @property {string} localComparisonProvider.errorType - what type of error will expect (flat or movement)
 * @property {number) localComparisonProvider.transparency - transparency intensity of the diff image
 * @property {[{x: {number}, y: {number}, width: {number}, height: {number}}]} localComparisonProvider.ignoreRectangles - array of coords of rectangles which will be ignored in comparison
 * @property {number) localComparisonProvider.thresholdPercentage - treshold image difference, in % to fail the comparison
 */

/**
 * @constructor
 * @implements {ComparisonProvider}
 * @param {LocalComparisonProviderConfig} config
 * @param {Logger} logger
 * @param {StorageProvider} storage provider
 */
function LocalComparisonProvider(config, logger, storageProvider) {
  this.config = config;
  this.logger = logger;

  this.storageProvider = storageProvider;
  this.thresholdPercentage = this.config.thresholdPercentage || DEFAULT_THRESHOLD_PERCENTAGE;

  config.compare = typeof config.compare !== 'undefined' ? config.compare : DEFAULT_COMPARE;
  config.update = typeof config.update !== 'undefined' ? config.update : DEFAULT_UPDATE;
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
        var defer = protractor.promise.defer();
        var result = {
          pass: defer
        };

        if(that.config.take && that.config.compare) {
          var actualImageBuffer = new Buffer(actEncodedImage, 'base64');
          var dataRefImage = [];

          // get the reference image from storage provider
          var refImageStream = that.storageProvider.readRefImage(expectedImageName);

          refImageStream.on('data', function (chunk) {
            dataRefImage.push(chunk);
          });

          refImageStream.on('error', function() {
            if(that.config.update) {
              that.logger.debug('Image comparison enabled but no reference image found: ' + expectedImageName +
                ' ,update enabled so storing current as reference' );
              updateRefImage(expectedImageName, actualImageBuffer);
              // TODO error handling - set done/error callback and fulfil/reject the promise there
              result.message = 'Image comparison enabled but no reference image found: ' + expectedImageName +
                ' ,update enabled so storing current as reference';
              defer.fulfill(true);
            } else {
              that.logger.debug('Image comparison enabled but no reference image found: ' + expectedImageName +
                ' ,update disabled');
              result.message = 'Image comparison enabled but no reference image found: ' + expectedImageName +
                ' ,update disabled';
              defer.fulfill(false);
            }
          });

          refImageStream.on('end', function () {
            var refImageBuffer = Buffer.concat(dataRefImage);
            var localComparisonProviderConfig = that.config.localComparisonProvider || {};

            resemble.outputSettings(localComparisonProviderConfig);

            // compare two images and add input settings - they are chained and set to resJS object
            // settings include ignore colors, ignore antialiasing, threshold and ignore rectangle
            that.logger.debug('Comparing current screenshot to reference image: ' + expectedImageName);
            resemble(refImageBuffer).compareTo(actualImageBuffer)
              .inputSettings(localComparisonProviderConfig).onComplete(function (comparisonResult) {

                // resolve mismatch percentage, dimension difference is elevated to 100%
                var mismatchPercentage = parseInt(comparisonResult.misMatchPercentage);
                if (!comparisonResult.isSameDimensions){
                  mismatchPercentage = 100;
                }

                // remove error pixes to avoid trace clutter
                var errorPixels = _.clone(comparisonResult.errorPixels);
                delete comparisonResult.errorPixels;

                that.logger.trace('Image comparison done, reference image: ' + expectedImageName +
                  ' ,result: ' +  JSON.stringify(comparisonResult) +
                   +  (that.logger.level > 2 ? (' ,error pixels: \n' + JSON.stringify(errorPixels)) : ''));

                // check the mismatch percentage
                if (mismatchPercentage < that.thresholdPercentage) {

                  that.logger.debug('Image comparison passed, reference image: ' + expectedImageName +
                    ' ,difference: ' +  mismatchPercentage + "% is below threshold: " + that.thresholdPercentage + '%');
                  result.message = 'Image comparison passed, reference image: ' + expectedImageName +
                    ' ,difference: ' +  mismatchPercentage + "% is below threshold: " + that.thresholdPercentage + '%';

                  // pass
                  defer.fulfill(true);
                } else {

                  that.logger.debug('Image comparison failed, reference image: ' + expectedImageName +
                    ' ,difference: ' +  mismatchPercentage + "% is above threshold: " + that.thresholdPercentage + '%');
                  result.message = 'Image comparison failed, reference image: ' + expectedImageName +
                    ' ,difference: ' +  mismatchPercentage + "% is above threshold: " + that.thresholdPercentage + '%';

                  // store diff image
                  that.logger.debug('Storing diff image: ' + expectedImageName);
                  var diffImageStream = that.storageProvider.storeDiffImage(expectedImageName);
                  comparisonResult.getDiffImage().pack().pipe(diffImageStream);

                  // store actual image
                  that.logger.debug('Storing actual image: ' + expectedImageName);
                  var actImageStream = that.storageProvider.storeActImage(expectedImageName);
                  actImageStream.write(actualImageBuffer);

                  if(that.config.update) {
                    that.logger.debug('Updating reference image: ' + expectedImageName + ' with the current screenshot');
                    updateRefImage(expectedImageName, actualImageBuffer);
                    // TODO error handling
                  }

                  // fail
                  defer.fulfill(false);
                }
              });
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

  function updateRefImage(expectedImageName, actualImageBuffer) {
    that.logger.debug('Storing reference image: ' + expectedImageName);
    var createRefImageStream = that.storageProvider.storeRefImage(expectedImageName);
    createRefImageStream.write(actualImageBuffer);
  }

  matchers.toLookAs = toLookAs;
};

module.exports = function (config, logger, storageProvider) {
  return new LocalComparisonProvider(config, logger, storageProvider);
};
