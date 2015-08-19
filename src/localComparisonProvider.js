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

// default values
var TARGET_FOLDER = 'diffs/';
var DIFF_FILE_NAME = 'diffr';
var DIFF_FILE_FORMAT = '.png';
var TOLERANCE = 5;

/**
 * @typedef LocalComparisonProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 * @property {boolean} compare - enable screenshot comparison
 *
 * @property {Boolean} localComparisonProvider.ignoreColors - setting for color ignore while image comparison
 * @property {Boolean} ignoreAntialiasing - setting for antialiasing ignore while image comparison
 * @property {Object} errorColor - object with red, green and blue properties for defining color for diff pixels
 * @property {String} errorType - what type of error will expect (flat or movement)
 * @property {Number) transparency - transparency of the diff image
 * @property {Array} ignoreRectangles - array of coords of rectangles which will be ignored in comparison
 * @property {Number) tolerance - above this percentage of difference the matcher will fail
 * */

/**
 * Image comparison custom jasmine matcher
 * @constructor
 * @param {ImageComparisonMatcherConfig} config - configs
 * */
function ImageComparisonMatcher(config, storageProvider) {
  this.config = config;

  this.take = this.config.imageComparison ? this.config.imageComparison.take : true;
  this.compare = this.config.imageComparison ? this.config.imageComparison.compare : true;
// all in one object
  this.targetFolder = this.config.imageComparison ? this.config.imageComparison.targetFolder : '';
  this.diffFileName = this.config.imageComparison ? this.config.imageComparison.diffFileName : '';
  this.ignoreColors = this.config.imageComparison ? this.config.imageComparison.ignoreColors : '';
  this.ignoreAntialiasing = this.config.imageComparison ? this.config.imageComparison.ignoreAntialiasing : '';
  this.errorColor = this.config.imageComparison ? this.config.imageComparison.errorColor : '';
  this.errorType = this.config.imageComparison ? this.config.imageComparison.errorType : '';
  this.transparency = this.config.imageComparison ? this.config.imageComparison.transparency : '';
  this.imageTolerance = this.config.imageComparison ? this.config.imageComparison.imageTolerance : '';
  this.ignoreRectangles = this.config.imageComparison ? this.config.imageComparison.ignoreRectangles : '';
  this.tolerance = this.config.imageComparison ? this.config.imageComparison.tolerance : TOLERANCE;

  this.storageProvider = storageProvider;

  var that = this;
  this.options = {
    tolerance: that.tolerance,

    take: that.take,
    compare: that.compare,

    ignoreColors: that.ignoreColors,
    ignoreAntialiasing: that.ignoreAntialiasing,
    ignoreRectangles: that.ignoreRectangles,
    imageTolerance: that.imageTolerance,

    errorColor: that.errorColor,
    errorType: that.errorType,
    transparency: that.transparency
  };
}

/**
 * Compare actual screenshot to reference screenshot
 * @typedef toLookLike
 * @type {function}
 * @extends Jasmine.compare
 * @global
 * @param {string} refImageName - ref image to compare against
 * @param (webdriver.promise<Buffer> - actualImageBuffer - actual screenshot
 *
 * Resolves the refImageName to a refImageBuffer using the given
 * storageProvider. Resolves the actual screenshot promise to actualImageBuffer.
 * Feeds both buffers to resemble and stores the diff image using the imageProvider.
 *
 * if(config.take && config.compare) => log info message and run, else log info message and exit.
 * */

/**
 * Registers the custom matcher to the jasmine matchers
 * */
ImageComparisonMatcher.prototype.register = function () {
  var jasmineEnv = jasmine.getEnv();
  var that = this;

  // create custom matcher
  var toLookLike = function () {
    return {
      compare: function (actual, expected) {
        // create defer object
        if(that.options.take && that.options.compare) {
          logger.info('Comparing screenshot to: ' + expected);
          var defer = webdriver.promise.defer();

          var refImageBuffer = '';
          var actualImageBuffer = '';
          var dataRefImage = [];

          // get the reference image
          var refImageStream = fs.createReadStream(expected);
          refImageStream.on('data', function (chunk) {
            dataRefImage.push(chunk);
          });

          refImageStream.on('end', function () {

            // create Buffers from streams - use in resemblejs-tolerance
            refImageBuffer = Buffer.concat(dataRefImage);
            actualImageBuffer = new Buffer(actual, 'base64');

            resemble.outputSettings(that.options);

            // compare two images
            var resJS = resemble(refImageBuffer).compareTo(actualImageBuffer);
            // how settings are passed... chaining
            resJS.inputSettings(that.options);

            resJS.onComplete(function (comparisonResultData) {

              var misMatchPercentage = parseInt(comparisonResultData.misMatchPercentage);
              var dimensionDifference = comparisonResultData.dimensionDifference;
              var errorPixels = comparisonResultData.errorPixels;
              var diffImage = comparisonResultData.getDiffImage();
              var isSameDimension = comparisonResultData.isSameDimensions;
              var misMatchCount = comparisonResultData.misMatchCount;

              // check the mismatch percentage
              if (misMatchPercentage < that.tolerance) {
                result.message = 'Mismatch percentage: ' + comparisonResultData.misMatchPercentage;

                defer.fulfill(true);
              } else {
                result.message = 'Mismatch percentage: ' + comparisonResultData.misMatchPercentage;
                //TODO: Implement custom reporter
                //logger.error('Expected image: ' + expected + ' to be the same as the screenshot. Mismatch percentage: ' + comparisonResultData.misMatchPercentage
                //  + ', misMatchCount: ' + misMatchCount);

                // call storageProvider methods
                if (that.storageProvider === 'local') {
                  logger.info('Loccal image storage chosen. Saving diff image...');
                  comparisonResultData.getDiffImage().pack().pipe(fs.createWriteStream(TARGET_FOLDER + DIFF_FILE_NAME + "-" + Date.now() + DIFF_FILE_FORMAT));
                } else if (that.storageProvider === 'central') {
                  loger.info('Central image storage chosen. Sending diff image...');
                  //TODO: Send diff image to central image storage
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

  // add custom matcher to jasmine matchers
  jasmineEnv.addMatchers({toLookLike: toLookLike});
};

module.exports = function (oConfig, storageProvider) {
  return new ImageComparisonMatcher(oConfig, storageProvider);
};
