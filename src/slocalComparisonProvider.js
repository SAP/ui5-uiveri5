/**
 * Created by I304310 on 6/15/2015.
 */
'use strict';

require('jasminewd2');
var webdriver = require('selenium-webdriver');
var resemble = require('resemblejs-tolerance');
var logger = require('./logger');

//default values
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
 * @param {LocalComparisonProviderConfig} config - configs
 */
function LocalComparisonProvider(config, storageProvider) {
  this.config = config;
  this.storageProvider = storageProvider;
  this.tolerance = this.config.tolerance || DEFAULT_TOLERANCE;
}

/**
 * Compare actual screenshot to reference screenshot
 * @typedef toLookLike
 * @type {function}
 * @extends Jasmine.compare
 * @global
 * @param {string} refImageName - ref image name to compare against
 * @param {webdriver.promise<Buffer>} - actualImageBuffer - actual screenshot
 *
 * Resolves the refImageName to a refImageBuffer using the given
 * storageProvider. Resolves the actual screenshot promise to actualImageBuffer.
 * Feeds both buffers to resemble and stores the diff image using the imageProvider.
 *
 * if(config.compare) => log info message and run, else log info message and exit.
 */

/**
 * Registers the custom matcher to the jasmine matchers
 */
LocalComparisonProvider.prototype.register = function () {
  var jasmineEnv = jasmine.getEnv();
  var that = this;

  // create jasmine custom matcher
  var toLookLike = function () {
    return {
      compare: function (actEncodedImage, expectedImageName) {
        if(that.config.compare) {
          var defer = webdriver.promise.defer();

          var actualImageBuffer = new Buffer(actEncodedImage, 'base64');
          var dataRefImage = [];

          // get the reference image from storage provider
          var refImageStream = that.storageProvider.readRefImage(expectedImageName);

          refImageStream.on('data', function (chunk) {
            dataRefImage.push(chunk);
          });

          refImageStream.on('error', function() {
            if(that.config.localComparisonProvider.update) {
              logger.info('No reference image found. Saving new one');
              updateRefImage(expectedImageName, actualImageBuffer);
            } else {
              logger.info('No reference image found');
              return {
                pass: false
              }
            }
          });

          refImageStream.on('end', function () {
            var refImageBuffer = Buffer.concat(dataRefImage);
            var localComparisonProviderConfig = that.config.localComparisonProvider || {};

            resemble.outputSettings(localComparisonProviderConfig);

            // compare two images and add input settings - they are chained and set to resJS object
            // settings include ignore colors, ignore antialiasing, threshold and ignore rectangle
            logger.debug('Comparing screenshot to: ' + expectedImageName);
            resemble(refImageBuffer).compareTo(actualImageBuffer)
              .inputSettings(localComparisonProviderConfig).onComplete(function (comparisonResultData) {

                var misMatchPercentage = parseInt(comparisonResultData.misMatchPercentage);
                //var dimensionDifference = comparisonResultData.dimensionDifference;
                //var errorPixels = comparisonResultData.errorPixels;
                //var diffImage = comparisonResultData.getDiffImage();
                //var isSameDimension = comparisonResultData.isSameDimensions;
                //var misMatchCount = comparisonResultData.misMatchCount;

                // check the mismatch percentage
                if (misMatchPercentage < that.tolerance) {
                  result.message = 'Image comparison failed. Reference image: ' + expectedImageName +
                    ' is not different from the actual image by: ' + comparisonResultData.misMatchPercentage + '%';
                  defer.fulfill(true);
                } else {
                  result.message = 'Image comparison failed. Reference image: ' + expectedImageName +
                    ' is different from the actual image by: ' + comparisonResultData.misMatchPercentage + '%';

                  // store diff image
                  logger.debug('Saving diff image');
                  var diffImageStream = that.storageProvider.storeDiffImage(expectedImageName);
                  comparisonResultData.getDiffImage().pack().pipe(diffImageStream);

                  // store actual image
                  logger.debug('Saving actual image');
                  var actImageStream = that.storageProvider.storeActImage(expectedImageName);
                  actImageStream.write(actualImageBuffer);

                  if(that.config.localComparisonProvider.update) {
                    logger.debug('Updating ref image with the current screenshot');
                    updateRefImage(expectedImageName, actualImageBuffer);
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
          logger.debug('Skipping image comparison.');
        }
      }
    }
  };

  function updateRefImage(expected, actualImageBuffer) {
    var createRefImageStream = that.storageProvider.storeRefImage(expected);
    createRefImageStream.write(actualImageBuffer);
  }

  // add custom matcher to jasmine matchers
  jasmineEnv.addMatchers({toLookLike: toLookLike});
};

module.exports = function (config, storageProvider) {
  return new LocalComparisonProvider(config, storageProvider);
};
