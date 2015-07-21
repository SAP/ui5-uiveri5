/**
 * Created by I304310 on 6/15/2015.
 */

/**
 *  @alias toLookLike
 *  @summary <code>expect(screenshot).toLookLike(screenshot)
 * */

var fs = require('fs');
var webdriver = require('selenium-webdriver');
require('jasminewd2');
var resemble = require('resemblejs-tolerance');

// default values
var TARGET_FOLDER = 'diffs/';
var DIFF_FILE_NAME = 'diffr';
var DIFF_FILE_FORMAT = '.png';
var IGNORE_COLORS = true;
var IGNORE_ANTIALIASING = true;
var ERROR_COLOR = {
  red: 255,
  green: 0,
  blue: 255
};
var ERROR_TYPE = 'movement';
var TRANSPARENCY = 0.3;
var IMAGE_TOLERANCE = 1200;
var IGNORE_RECTANGLE = [[325, 170, 100, 40]];
var TOLERANCE = 10;

function ImageComparisonMatcher(config) {
  this.config = config;
  this.targetFolder = this.config.targetFolder ? this.config.targetFolder : TARGET_FOLDER;
  this.diffFileName = this.config.diffFileName ? this.config.diffFileName : DIFF_FILE_NAME;
  this.ignoreColors = this.config.ignoreColors ? this.config.ignoreColors : IGNORE_COLORS;
  this.ignoreAntialiasing = this.config.ignoreAntialiasing ? this.config.ignoreAntialiasing : IGNORE_ANTIALIASING;
  this.errorColor = this.config.errorColor ? this.config.errorColor : ERROR_COLOR;
  this.errorType = this.config.errorType ? this.config.errorType : ERROR_TYPE;
  this.transparency = this.config.transparency ? this.config.transparency : TRANSPARENCY;
  this.imageTolerance = this.config.imageTolerance ? this.config.imageTolerance : IMAGE_TOLERANCE;
  this.ignoreRectangles = this.config.ignoreRectangles ? this.config.ignoreRectangles : IGNORE_RECTANGLE;
  this.tolerance = this.config.tolerance ? this.config.tolerance : TOLERANCE;

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

ImageComparisonMatcher.prototype.register = function () {
  var jasmineEnv = jasmine.getEnv();
  var that = this;
  var toLookLike = function () {
    return {
      compare: function (expected, actual) {
        //to be async
        var d = webdriver.promise.defer();

        var expectedImageBuffer = '';
        var actualImageBuffer = '';
        var dataExpectedImage = [];
        var dataActualImage = [];
        var expectedImageStream = fs.createReadStream(expected);
        expectedImageStream.on('data', function (chunk) {
          dataExpectedImage.push(chunk);
        });

        expectedImageStream.on('end', function () {
          expectedImageBuffer = Buffer.concat(dataExpectedImage);

          var actualImageStream = fs.createReadStream(actual);
          actualImageStream.on('data', function (chunk) {
            dataActualImage.push(chunk);
          });
          actualImageStream.on('end', function () {
            actualImageBuffer = Buffer.concat(dataActualImage);

            // set outputSettings
            resemble.outputSettings(that.options);
            var resJS = resemble(expectedImageBuffer).compareTo(actualImageBuffer);
            resJS.inputSettings(that.options);

            resJS.onComplete(function (data) {
              var misMatchPercentage = parseInt(data.misMatchPercentage);
              var dimensionDifference = data.dimensionDifference;
              var errorPixels = data.errorPixels;
              var diffImage = data.getDiffImage();
              var isSameDimension = data.isSameDimensions;
              var misMatchCount = data.misMatchCount;

              data.getDiffImage().pack().pipe(fs.createWriteStream(TARGET_FOLDER + DIFF_FILE_NAME + "-" + Date.now() + DIFF_FILE_FORMAT));

              if (misMatchPercentage < 10) {
                result.message = "Expected image " + expected + " to be the same as image " + actual + ". Mismatch percentage: " + data.misMatchPercentage
                + ", errorPixels: " + errorPixels + ", misMatchCount: " + misMatchCount + ", dimensionDifference: " + dimensionDifference;

                d.fulfill(true);
              } else {
                result.message = "Expected image " + expected + " to be the same as image " + actual + ". Mismatch percentage: " + data.misMatchPercentage
                + ", misMatchCount: " + misMatchCount + ", dimensionDifference: " + dimensionDifference;

                d.fulfill(false);
              }
            });
          });
        });

        var result = {
          pass: d.then(function (res) {
            return res;
          })
        };

        return result;
      }
    }
  };

  jasmineEnv.addMatchers({toLookLike: toLookLike});
};

module.exports = function (oConfig) {
  return new ImageComparisonMatcher(oConfig);
};
