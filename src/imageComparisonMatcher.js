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
 * @typedef ImageComparisonMatcherConfig
 * @type {Object}
 * @property {String} targetFolder - folder where the diff image will be saved
 * @property {String} diffFileName - name of the diff image file
 * @property {Boolean} ignoreColors - setting for color ignore while image comparison
 * @property {Boolen} ignoreAntialiasing - setting for antialiasing ignore while image comparison
 * @property {Object} errorColor - object with red, green and blue properties for defining color for diff pixels
 * @property {String} errorType - what type of error will expect (flat or movement)
 * @property {Number) transparency - transparency of the diff image
 * @property {Array} ignoreRectangles - array of coords of rectangles which will be ignored in comparison
 * @property {Number) tolerance - above this percentage of difference the matcher will fail
 *
 * */

/**
 * Image comparison custom jasmine matcher
 * @constructor
 * @param {ImageComparisonMatcherConfig} config - configs
 * */
function ImageComparisonMatcher(config) {
  this.config = config;
  this.targetFolder = this.config.screenshotTaking ? this.config.screenshotTaking.targetFolder : '';
  this.diffFileName = this.config.screenshotTaking ? this.config.screenshotTaking.diffFileName : '';
  this.ignoreColors = this.config.screenshotTaking ? this.config.screenshotTaking.ignoreColors : '';
  this.ignoreAntialiasing = this.config.screenshotTaking ? this.config.screenshotTaking.ignoreAntialiasing : '';
  this.errorColor = this.config.screenshotTaking ? this.config.screenshotTaking.errorColor : '';
  this.errorType = this.config.screenshotTaking ? this.config.screenshotTaking.errorType : '';
  this.transparency = this.config.screenshotTaking ? this.config.screenshotTaking.transparency : '';
  this.imageTolerance = this.config.screenshotTaking ? this.config.screenshotTaking.imageTolerance : '';
  this.ignoreRectangles = this.config.screenshotTaking ? this.config.screenshotTaking.ignoreRectangles : '';
  this.tolerance = this.config.screenshotTaking ? this.config.screenshotTaking.tolerance : TOLERANCE;

  var that = this;
  this.options = {
    tolerance: that.tolerance,

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
 * Registers the custom matcher to the jasmine matchers
 * */
ImageComparisonMatcher.prototype.register = function () {
  var jasmineEnv = jasmine.getEnv();
  var that = this;

  // create custom matcher
  var toLookLike = function () {
    return {
      compare: function (actual, expected) {
        // create deffer object
        var defer = webdriver.promise.defer();

        var expectedImageBuffer = '';
        var actualImageBuffer = '';
        var dataExpectedImage = [];

        // get the reference image
        var expectedImageStream = fs.createReadStream(expected);
        expectedImageStream.on('data', function (chunk) {
          dataExpectedImage.push(chunk);
        });

        expectedImageStream.on('end', function () {

          // create Buffers from streams - use in resemblejs-tolerance
          expectedImageBuffer = Buffer.concat(dataExpectedImage);
          actualImageBuffer = new Buffer(actual, 'base64');

          // set outputSettings
          resemble.outputSettings(that.options);

          // compare two images
          var resJS = resemble(expectedImageBuffer).compareTo(actualImageBuffer);
          resJS.inputSettings(that.options);

          // on comparison complate
          resJS.onComplete(function (data) {

            // data after comparison
            var misMatchPercentage = parseInt(data.misMatchPercentage);
            var dimensionDifference = data.dimensionDifference;
            var errorPixels = data.errorPixels;
            var diffImage = data.getDiffImage();
            var isSameDimension = data.isSameDimensions;
            var misMatchCount = data.misMatchCount;

            // check the mismatch percentage
            if (misMatchPercentage < that.tolerance) {
              result.message = 'Mismatch percentage: ' + data.misMatchPercentage;
              logger.error('Expected image: ' + expected + ' to be the same as the screenshot. Mismatch percentage: ' + data.misMatchPercentage
                + ', errorPixels: ' + errorPixels + ', misMatchCount: ' + misMatchCount);
              // pass
              defer.fulfill(true);
            } else {
              result.message = 'Mismatch percentage: ' + data.misMatchPercentage;
              logger.error('Expected image: ' + expected + ' to be the same as the screenshot. Mismatch percentage: ' + data.misMatchPercentage
                + ', errorPixels: ' + errorPixels + ', misMatchCount: ' + misMatchCount);
              data.getDiffImage().pack().pipe(fs.createWriteStream(TARGET_FOLDER + DIFF_FILE_NAME + "-" + Date.now() + DIFF_FILE_FORMAT));
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
      }
    }
  };

  // add custom matcher to jasmine matchers
  jasmineEnv.addMatchers({toLookLike: toLookLike});
};

module.exports = function (oConfig) {
  return new ImageComparisonMatcher(oConfig);
};
