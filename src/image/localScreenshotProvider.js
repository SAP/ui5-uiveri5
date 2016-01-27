
var DEFAULT_TAKE = true;
var Q = require('q');
var pngCrop = require('png-crop');
/**
 * @typedef LocalScreenshotProviderConfig
 * @type {Object}
 * @extends {Config}
 * @property {boolean} take - enable screenshot taking
 */

/**
 * @typedef LocalScreenshotProviderInstanceConfig
 * @type {Object}
 */

/**
 * Screenshot provider
 * @constructor
 * @implements {ScreenshotProvider}
 * @param {LocalScreenshotProviderConfig} config
 * @param {LocalScreenshotProviderInstanceConfig} instanceConfig
 * @param {Logger} logger
 */
function LocalScreenshotProvider(config,instanceConfig,logger) {
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;

  // set default for take if not provided
  this.take = typeof config.take !== 'undefined' ? config.take : DEFAULT_TAKE;

  this.screenshotSleep = instanceConfig.screenshotSleep;
}

/**
 * Registers takeScreenshot at global variable
 */
LocalScreenshotProvider.prototype.register = function() {
  var that = this;

  global.takeScreenshot = function(element) {
    if (that.take) {
      // take screenshot once UI5 has settled down
      return browser.waitForAngular().then(function(){
        // TODO find and fix all offending CSS animations and then remote this sleep
        // wait a little bit more to work around css animations that could not be disabled easily
        if (that.screenshotSleep){
          browser.sleep(that.screenshotSleep);
        }

        // uses browser object and call webdriverjs function takeScreenshot
        that.logger.debug('Taking actual screenshot');
        return browser.takeScreenshot().then(function (screenshot) {
          if (element) {
            var originalImageBuffer = new Buffer(screenshot, 'base64');
            var cropConfig = {};
            // find element dimensions and location
            return element.getSize().then(function(elementSize) {
              cropConfig.width = elementSize.width;
              cropConfig.height = elementSize.height;
              return element.getLocation().then(function(elementLocation) {
                cropConfig.top = elementLocation.y;
                cropConfig.left = elementLocation.x;
                return Q.Promise(function(resolveFn,rejectFn) {
                  that.logger.debug('Cropping the screenshot with parameters: width=' + cropConfig.width +
                    ', height=' + cropConfig.height + ', top=' + cropConfig.top + ', left=' + cropConfig.left);
                  pngCrop.cropToStream(originalImageBuffer, cropConfig, function (err, outputStream) {
                    if (err) {
                      rejectFn(new Error('Cannot crop the screenshot: ' + err));
                    } else {
                      var chunks = [];
                      outputStream.on('data', function (chunk) {
                        chunks.push(chunk);
                      });
                      outputStream.on('error', function (error) {
                        rejectFn(new Error('Cannot crop the screenshot: ' + error));
                      });
                      outputStream.on('end', function () {
                        var croppedImageBuffer = Buffer.concat(chunks);
                        resolveFn(
                          croppedImageBuffer.toString('base64')
                        );
                      });
                    }
                  });
                });
              });
            });
          } else {
            return screenshot;
          }
        });
      });
    } else {
      that.logger.debug('Screenshot taking disabled so skipping it');
      return '';  // TODO return resolved promise ?
    }
  };
};

module.exports = function (config,instanceConfig,logger) {
  return new LocalScreenshotProvider(config,instanceConfig,logger);
};
