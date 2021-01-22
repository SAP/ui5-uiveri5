
var DEFAULT_TAKE = true;
var webdriver = require('selenium-webdriver');
var pngCrop = require('png-crop');
var _ = require('lodash');
var PNG = require('pngjs').PNG;
var ScreenshotSetup = require('./screenshotSetup');

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
 * @param {Runtime} runtime
 */
function LocalScreenshotProvider(config, instanceConfig, logger, runtime) {
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.runtime = runtime;

  // set default for take if not provided
  this.take = typeof config.take !== 'undefined' ? config.take : DEFAULT_TAKE;

  this.screenshotSetup = new ScreenshotSetup(instanceConfig, logger);
}

/**
 * Registers takeScreenshot at global variable
 */
LocalScreenshotProvider.prototype.register = function() {
  var that = this;

  global.takeScreenshot = function (element) {
    if (that.take) {
      // take screenshot once UI5 has settled down
      return browser.waitForUI5().then(function(){
        // uses browser object and call webdriverjs function takeScreenshot
        that.logger.debug('Taking actual screenshot');
        return that.screenshotSetup.beforeScreenshot()
          .then(function () {
            return that._takeFullScreenshot();
          }).then(function (fullScreenshot) {
            return that._getBrowserScreenshot(fullScreenshot);
          }).then(function(browserScreenshot) {
            return that._cropScreenshot(browserScreenshot, element);
          }).then(function (screenshot) {
            return screenshot;
          });
      });
    } else {
      that.logger.debug('Screenshot taking disabled so skipping it');
      return '';  // TODO return resolved promise ?
    }
  };
};

/**
 * Take full screenshot (on mobile devices can be device screenshot)
 * @return {string} fullScreenshot, base 64 encoded
 * @private
 */
LocalScreenshotProvider.prototype._takeFullScreenshot = function() {
  var that = this;
  that.logger.debug('Taking full screenshot');

  var remoteOptions = that.runtime.capabilities.remoteWebDriverOptions;
  if(remoteOptions && remoteOptions.contextSwitch) {
    var nativeName = 'NATIVE_APP';
    var webviewName = 'WEBVIEW_1';
    if (_.isObject(remoteOptions.contextSwitch)) {
      if(remoteOptions.contextSwitch.native) {
        nativeName = remoteOptions.contextSwitch.native;
      }
      if(remoteOptions.contextSwitch.webView) {
        webviewName = remoteOptions.contextSwitch.webview;
      }
    }

    that.logger.debug('Switch browser context to: ' + nativeName);
    return browser.switchContext(nativeName).then(function () {
      return browser.takeScreenshot().then(function (fullScreenshot) {
        that.logger.debug('Switch browser context back to: ' + webviewName);
        return browser.switchContext(webviewName).then(function () {
          return webdriver.promise.fulfilled(fullScreenshot);
        });
      });
    });
  } else {
    return browser.takeScreenshot().then(function (fullScreenshot) {
      return webdriver.promise.fulfilled(fullScreenshot);
    });
  }
};

/**
 * Get browser screenshot. Ex: on mobile emulator/simulator crop the status bar, navigation buttons and etc
 * @param {string} fullScreenshot, base 64 encoded
 * @return {string} browserScreenshot, base 64 encoded
 * @private
 */
LocalScreenshotProvider.prototype._getBrowserScreenshot = function(fullScreenshot) {
  var that = this;
  that.logger.debug('Taking browser screenshot');

  var remoteOptions = that.runtime.capabilities.remoteWebDriverOptions;
  if(remoteOptions && remoteOptions.crops) {
    that.logger.debug('Cropping viewport screenshot');
    var screenshotBuffer = new Buffer(fullScreenshot, 'base64');

    var runtimeResolution = that.runtime.platformResolution.split('x');
    var cropConfig = {};
    cropConfig.width = runtimeResolution[0];
    cropConfig.height = runtimeResolution[1];
    cropConfig.top = 0;
    cropConfig.left = 0;

    if (remoteOptions.crops.size) {
      if (remoteOptions.crops.size.width) {
        cropConfig.width = remoteOptions.crops.size.width;
      }
      if (remoteOptions.crops.size.height) {
        cropConfig.height = remoteOptions.crops.size.height;
      }
    }
    if (remoteOptions.crops.position) {
      if (remoteOptions.crops.position.x) {
        cropConfig.left = remoteOptions.crops.position.x;
      }
      if (remoteOptions.crops.position.y) {
        cropConfig.top = remoteOptions.crops.position.y;
      }
    }

    return that._crop(screenshotBuffer, cropConfig).then(function (browserScreenshot) {
      return webdriver.promise.fulfilled(browserScreenshot);
    });
  } else {
    return webdriver.promise.fulfilled(fullScreenshot);
  }
};

/**
 * Get single control screenshot if element cropping is requested
 * @param {string} browserScreenshot, base 64 encoded
 * @param {ElementFinder Object} element
 * @return {string} screenshot, base 64 encoded
 * @private
 */
LocalScreenshotProvider.prototype._cropScreenshot = function(browserScreenshot, element) {
  var that = this;
  var deferCropScreenshot = webdriver.promise.defer();

  if(element) {
    var originalImageBuffer = new Buffer(browserScreenshot, 'base64');
    var elementDimensions = {};
    // find element dimensions and location
    element.getSize().then(function (elementSize) {
      elementDimensions.width = elementSize.width;
      elementDimensions.height = elementSize.height;
      that.logger.debug('Element dimensions in CSS pixels: width=' + elementDimensions.width + ', height=' + elementDimensions.height);
      if (elementDimensions.width <= 0 || elementDimensions.height <= 0) {
        deferCropScreenshot.reject(new Error('Cannot crop element because of size issue! Element width=' +
          elementDimensions.width + ', height=' + elementDimensions.height));
      } else {
        element.getLocation().then(function (elementLocation) {
          elementDimensions.top = elementLocation.y;
          elementDimensions.left = elementLocation.x;
          that.logger.debug('Element location in CSS pixels: top=' + elementDimensions.top + ', left=' + elementDimensions.left);
          var remoteOptions = that.runtime.capabilities.remoteWebDriverOptions;
          if (remoteOptions && remoteOptions.scaling) {
            if (remoteOptions.scaling.x && remoteOptions.scaling.x > 0 && remoteOptions.scaling.x !== 1) {
              elementDimensions.width = Math.round(elementDimensions.width * remoteOptions.scaling.x);
              elementDimensions.left = Math.round(elementDimensions.left * remoteOptions.scaling.x);
            }
            if (remoteOptions.scaling.y && remoteOptions.scaling.y > 0 && remoteOptions.scaling.y !== 1) {
              elementDimensions.height = Math.round(elementDimensions.height * remoteOptions.scaling.y);
              elementDimensions.top = Math.round(elementDimensions.top * remoteOptions.scaling.y);
            }
            that.logger.debug('Element scaling factor: x=' + remoteOptions.scaling.x + ', y=' + remoteOptions.scaling.y);
          }
          var png = new PNG();
          png.parse(originalImageBuffer, function (err, data) {
            if (err) {
              deferCropScreenshot.reject(new Error('Cannot crop the screenshot: ' + err));
            } else {
              that.logger.debug('View port in display pixels: width=' + data.width + ', height=' + data.height);
              // check if the element is completely outside the view port
              if (elementDimensions.left > data.width || elementDimensions.top > data.height ||
                ((elementDimensions.width + elementDimensions.left) < 0) ||
                ((elementDimensions.height + elementDimensions.top) < 0)) {
                deferCropScreenshot.reject(new Error('Cannot crop element because is outside of the view port. ' +
                  'View port in display pixels: width=' + data.width + ', height=' + data.height + '. Element properties in display pixels: width=' +
                  elementDimensions.width + ', height=' + elementDimensions.height + ', left=' + elementDimensions.left +
                  ', top=' + elementDimensions.top));
              } else {
                // element is partially or completely in the view port
                var cropConfig = {};
                if (elementDimensions.left < 0) {
                  cropConfig.left = 0;
                  cropConfig.width = Math.min((elementDimensions.width + elementDimensions.left), data.width);
                } else {
                  cropConfig.left = elementDimensions.left;
                  cropConfig.width = (elementDimensions.width + elementDimensions.left) < data.width ?
                    elementDimensions.width : (data.width - elementDimensions.left);
                }

                if (elementDimensions.top < 0) {
                  cropConfig.top = 0;
                  cropConfig.height = Math.min((elementDimensions.height + elementDimensions.top), data.height);
                } else {
                  cropConfig.top = elementDimensions.top;
                  cropConfig.height = (elementDimensions.height + elementDimensions.top) < data.height ?
                    elementDimensions.height : (data.height - elementDimensions.top);
                }

                that.logger.debug('Trying to crop element in display pixels with config: ' + JSON.stringify(cropConfig));
                // crop only if the cropConfig width and height are proper
                if(cropConfig.width > 0 && cropConfig.height > 0) {
                  that._crop(originalImageBuffer, cropConfig).then(function (croppedElement) {
                    deferCropScreenshot.fulfill(croppedElement);
                  });
                } else {
                  deferCropScreenshot.reject(new Error('Requested element for crop is placed partially or fully ' +
                    'outside the viewport. In display pixels element width=' + cropConfig.width + ', height=' + cropConfig.height
                    + ', left=' + cropConfig.left + ', top=' + cropConfig.top));
                }
              }
            }
          });
        });
      }
    });
  } else {
    this.logger.debug('No element provided, continue with full browser screenshot.');
    deferCropScreenshot.fulfill(browserScreenshot);
  }

  return deferCropScreenshot.promise;
};

/**
 * Crop given screenshot by cropping parameters
 * @param {Uint8Array} originalImageBuffer
 * @param {Object} cropConfig, Ex: {width: '', height: '', top: '', left: ''}
 * @return {string} croppedImageBuffer, base 64 encoded
 * @private
 */
LocalScreenshotProvider.prototype._crop = function(originalImageBuffer, cropConfig) {
  var that = this;
  var deferCrop = webdriver.promise.defer();

  // Round values for correct calculations in cropping
  cropConfig.top = Math.round(cropConfig.top);
  cropConfig.left = Math.round(cropConfig.left);
  cropConfig.width = Math.round(cropConfig.width);
  cropConfig.height = Math.round(cropConfig.height);
  that.logger.debug('Cropping the screenshot with parameters in display pixels: width=' + cropConfig.width +
    ', height=' + cropConfig.height + ', top=' + cropConfig.top + ', left=' + cropConfig.left);

  pngCrop.cropToStream(originalImageBuffer, cropConfig, function (err, outputStream) {
    if (err) {
      deferCrop.reject(new Error('Cannot crop the screenshot: ' + err));
    } else {
      var chunks = [];
      outputStream.on('data', function (chunk) {
        chunks.push(chunk);
      });
      outputStream.on('error', function (error) {
        deferCrop.reject(new Error('Cannot crop the screenshot: ' + error));
      });
      outputStream.on('end', function () {
        var croppedImageBuffer = Buffer.concat(chunks);
        deferCrop.fulfill(croppedImageBuffer.toString('base64'));
      });
    }
  });

  return deferCrop.promise;
};

module.exports = function (config, instanceConfig, logger, runtime) {
  return new LocalScreenshotProvider(config, instanceConfig, logger, runtime);
};
