/**
 * Created by I304310 on 6/15/2015.
 */
'use strict';

var _ = require('lodash');
var resemble = require('resemblejs-tolerance');

//default values
var DEFAULT_COMPARE = true;
var DEFAULT_UPDATE = false;
var DEFAULT_TOLERANCE = 5;

/**
 * @typedef LocalComparisonProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} compare - enable screenshot comparison
 *
 * @property {boolean} localComparisonProvider.ignoreColors - enable color ignore in comparison
 * @property {boolean} localComparisonProvider.ignoreAntialiasing - enable antialiasing ignore while image comparison
 * @property {{red: {number}, green: {number}, blue: {number}}} localComparisonProvider.errorColor - object with red, green and blue number value for defining color for diff pixels
 * @property {string} localComparisonProvider.errorType - what type of error will expect (flat or movement)
 * @property {number) localComparisonProvider.transparency - transparency intensity of the diff image
 * @property {[{x: {number}, y: {number}, width: {number}, height: {number}}]} localComparisonProvider.ignoreRectangles - array of coords of rectangles which will be ignored in comparison
 * @property {number) localComparisonProvider.tolerance - above this percentage of difference the matcher will fail
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
  this.tolerance = this.config.tolerance || DEFAULT_TOLERANCE;
  this.compare = config.compare || DEFAULT_COMPARE;
  this.update = config.update || DEFAULT_UPDATE;
}

/**
 * Registers the custom matcher to jasmine environment
 */
LocalComparisonProvider.prototype.register = function (matchers) {
  var that = this;

  // create jasmine custom matcher
  var toLookAs = function () {
    return {
      compare: function (actEncodedImage, expectedImageName) {
        if(that.compare) {
          var defer = protractor.promise.defer();

          var actualImageBuffer = new Buffer(actEncodedImage, 'base64');
          var dataRefImage = [];

          // get the reference image from storage provider
          var refImageStream = that.storageProvider.readRefImage(expectedImageName);

          refImageStream.on('data', function (chunk) {
            dataRefImage.push(chunk);
          });

          refImageStream.on('error', function() {
            if(that.update) {
              that.logger.debug('Comparison enabled but no reference image found: ' + expectedImageName + ' ,storing current as reference' );
              updateRefImage(expectedImageName, actualImageBuffer);
              // TODO error handling - set done/error callback and fulfil/reject the promise there
              result.message = 'Image comparison enabled but no reference image found: ' + expectedImageName + ' ,storing current as reference';
              defer.fulfill(true);
            } else {
              that.logger.debug('Comparison enabled but no reference image found: ' + expectedImageName);
              result.message = 'Image comparison enabled but no reference image found: ' + expectedImageName;
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
              .inputSettings(localComparisonProviderConfig).onComplete(function (comparisonResultData) {

                var misMatchPercentage = parseInt(comparisonResultData.misMatchPercentage);
                //var dimensionDifference = comparisonResultData.dimensionDifference;
                var errorPixels = _.clone(comparisonResultData.errorPixels);
                delete comparisonResultData.errorPixels;
                //var diffImage = comparisonResultData.getDiffImage();
                //var isSameDimension = comparisonResultData.isSameDimensions;
                //var misMatchCount = comparisonResultData.misMatchCount;

                // check the mismatch percentage
                if (misMatchPercentage < that.tolerance) {

                  that.logger.debug('Image comparison passed. Reference image: ' + expectedImageName +
                    ' ,tolerance: ' + that.tolerance +
                    ' ,results: ' + JSON.stringify(comparisonResultData));
                  that.logger.trace('Image comparison for reference image: ' + expectedImageName +
                    ' error pixels: ' +  (that.logger.level > 2 ? ('\n' + JSON.stringify(errorPixels) + '\n') : ''));

                  result.message = 'Image comparison passed. Reference image: ' + expectedImageName +
                    ' is not different from the actual image by: ' + comparisonResultData.misMatchPercentage + '%';

                  // pass
                  defer.fulfill(true);
                } else {

                  that.logger.debug('Image comparison faliled. Reference image: ' + expectedImageName +
                  ' ,tolerance: ' + that.tolerance +
                  ' ,results: ' + JSON.stringify(comparisonResultData));
                  that.logger.trace('Image comparison for reference image: ' + expectedImageName +
                  ' error pixels: ' +  (that.logger.level > 2 ? ('\n' + JSON.stringify(errorPixels) + '\n') : ''));

                  result.message = 'Image comparison failed. Reference image: ' + expectedImageName +
                    ' is different from the actual image by: ' + comparisonResultData.misMatchPercentage + '%';

                  // store diff image
                  that.logger.debug('Saving diff image');
                  var diffImageStream = that.storageProvider.storeDiffImage(expectedImageName);
                  comparisonResultData.getDiffImage().pack().pipe(diffImageStream);

                  // store actual image
                  that.logger.debug('Saving actual image');
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

          // matcher have to return result object with boolean pass value
          var result = {
            pass: defer.then(function (res) {
              return res;
            })
          };

          return result;
        } else {
          that.logger.debug('Skipping image comparison.');
        }
      }
    }
  };

  function updateRefImage(expected, actualImageBuffer) {
    var createRefImageStream = that.storageProvider.storeRefImage(expected);
    createRefImageStream.write(actualImageBuffer);
  }

  /*
  // add custom matcher to jasmine matchers
  beforeEach(function() {
    jasmine.getEnv().addMatchers({toLookAs: toLookAs});
  });
  */
  matchers.toLookAs = toLookAs;
};

module.exports = function (config, logger, storageProvider) {
  return new LocalComparisonProvider(config, logger, storageProvider);
};
