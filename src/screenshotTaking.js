/**
 * Created by I304310 on 7/22/2015.
 */
'use strict';

/**
 * Screenshot provider
 * @constructor
 * @param (ScreenshotTakingConfig} config - configs
 * */
function ScreenshotTaking(config) {
  // user configurations
}

/**
 * Registers takeScreenshot at global variable
 * */
ScreenshotTaking.prototype.register = function() {
  global.takeScreenshot = function() {
    // uses browser object and call webdriverjs function takeScreenshot
    return browser.takeScreenshot().then(function(data) {

      //TODO: Where we have to save the screenshot? At lib folder/visual/...?
      //var stream = fs.createWriteStream('screenshot/screenshot.png');
      //stream.write(new Buffer(data, 'base64'));
      //stream.end();

      return data;
    });
  };
};

module.exports = function (oConfig) {
  return new ScreenshotTaking(oConfig);
};
