/**
 * Created by I304310 on 6/15/2015.
 */
'use strict';
/**
 *  @alias toLookLike
 *  @summary <code>expect(screenshot).toLookLike(screenshot)
 * */

var fs = require('fs');
var webdriver = require('selenium-webdriver');
require('jasminewd2');
var resemble = require('resemblejs-tolerance');
var logger = require('./logger');

/**
 * @typedef LocalComparisonProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} compare - enable screenshot comparison
 *
 * @property {Boolean} localComparisonProvider.ignoreColors - enable color ignore in comparison
 * @property {Boolean} localComparisonProvider.ignoreAntialiasing - enable antialiasing ignore while image comparison
 * @property {Object} localComparisonProvider.errorColor - object with red, green and blue number value for defining color for diff pixels
 * @property {String} localComparisonProvider.errorType - what type of error will expect (flat or movement)
 * @property {Number) localComparisonProvider.transparency - transparency intensity of the diff image
 * @property {Array} localComparisonProvider.ignoreRectangles - array of coords of rectangles which will be ignored in comparison
 * @property {Number) localComparisonProvider.tolerance - above this percentage of difference the matcher will fail
 * */

/**
 * Image comparison custom jasmine matcher
 * @tructor
 * @param {ImageComparisonMatcherConfig} config - configs
 * */
function ImageComparisonMatcher(config, storageProvider) {
  this.config = config;
  this.storageProvider = storageProvider;
}

/**
 * Compare actual screenshot to reference screenshot
 * @typedef toLookLike
 * @type {function}
 * @extends Jasmine.compare
 * @global
 * @param {string} refImageName - ref image name to compare against
 * @param (webdriver.promise<Buffer> - actualImageBuffer - actual screenshot
 *
 * Resolves the refImageName to a refImageBuffer using the given
 * storageProvider. Resolves the actual screenshot promise to actualImageBuffer.
 * Feeds both buffers to resemble and stores the diff image using the imageProvider.
 *
 * if(config.compare) => log info message and run, else log info message and exit.
 * */

/**
 * Registers the custom matcher to the jasmine matchers
 * */
ImageComparisonMatcher.prototype.register = function () {
  var jasmineEnv = jasmine.getEnv();
  var that = this;

  // create jasmine custom matcher
  var toLookLike = function () {
    return {
      compare: function (actual, expected) {
        if(that.config.compare) {
          var defer = webdriver.promise.defer();

          var refImageBuffer = '';
          var actualImageBuffer = new Buffer(actual, 'base64');
          var dataRefImage = [];

          // get the reference image from storage provider
          var refImageStream = that.storageProvider.readRefImage(expected);

          refImageStream.on('data', function (chunk) {
            dataRefImage.push(chunk);
          });

          refImageStream.on('error', function() {
            if(that.config.update) {
              logger.info('No reference image found. Saving new one');
              updateRefImage(expected, actualImageBuffer);
            } else {
              logger.info('No reference image found');
              return {
                pass: false
              }
            }
          });

          refImageStream.on('end', function () {

            // create Buffers from streams - use in resemblejs-tolerance
            refImageBuffer = Buffer.concat(dataRefImage);

            resemble.outputSettings(that.config);

            // compare two images and add input settings - they are chained and set to resJS object
            // settings include ignore colors, ignore antialiasing, threshold and ignore rectangle
            logger.info('Comparing screenshot to: ' + expected);
            var resJS = resemble(refImageBuffer).compareTo(actualImageBuffer)
              .inputSettings(that.config).onComplete(function (comparisonResultData) {

                var misMatchPercentage = parseInt(comparisonResultData.misMatchPercentage);
                var dimensionDifference = comparisonResultData.dimensionDifference;
                var errorPixels = comparisonResultData.errorPixels;
                var diffImage = comparisonResultData.getDiffImage();
                var isSameDimension = comparisonResultData.isSameDimensions;
                var misMatchCount = comparisonResultData.misMatchCount;

                // check the mismatch percentage
                if (misMatchPercentage < that.config.tolerance) {
                  result.message = 'Mismatch percentage: ' + comparisonResultData.misMatchPercentage;
                  defer.fulfill(true);
                } else {
                  result.message = 'Mismatch percentage: ' + comparisonResultData.misMatchPercentage;

                  // store diff image
                  logger.info('Saving diff image');
                  var diffImageStream = that.storageProvider.storeDiffImage(expected);
                  comparisonResultData.getDiffImage().pack().pipe(diffImageStream);

                  // store actual image
                  logger.info('Saving actual image');
                  var actImageStream = that.storageProvider.storeActImage(expected);
                  actImageStream.write(actualImageBuffer);

                  if(that.config.update) {
                    logger.info('Updating ref image with the current screenshot');
                    updateRefImage(expected, actualImageBuffer);
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
          logger.info('Skipping image comparison.');
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

module.exports = function (oConfig, storageProvider) {
  return new ImageComparisonMatcher(oConfig, storageProvider);
};
