
var _ = require('lodash');
var resemble = require('resemblejs-tolerance');
var webdriver = require('selenium-webdriver');

//default values
var DEFAULT_COMPARE = true;
var DEFAULT_UPDATE = false;
var DEFAULT_THRESHOLD_PERCENTAGE = 1;

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
 * @property {number) thresholdPercentage - treshold image difference, in % to fail the comparison
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
          var dataRefImage = [];

          // get the reference image from storage provider
          var refImageStream = that.storageProvider.readRefImage(expectedImageName);

          refImageStream.on('data', function (chunk) {
            dataRefImage.push(chunk);
          });

          refImageStream.on('error', function() {
            if(that.update) {
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

            resemble.outputSettings(that.instanceConfig);

            // compare two images and add input settings - they are chained and set to resJS object
            // settings include ignore colors, ignore antialiasing, threshold and ignore rectangle
            that.logger.debug('Comparing current screenshot to reference image: ' + expectedImageName);
            resemble(refImageBuffer).compareTo(actualImageBuffer)
              .inputSettings(that.instanceConfig).onComplete(function(comparisonResult) {

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

                  if(that.update) {
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

module.exports = function (config,instanceConfig,logger,storageProvider) {
  return new LocalComparisonProvider(config,instanceConfig,logger,storageProvider);
};
