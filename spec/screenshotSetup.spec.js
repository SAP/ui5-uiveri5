var sinon = require('sinon');
var webdriver = require('selenium-webdriver');
var ScreenshotSetup = require('../src/image/screenshotSetup');

function spyOnBrowser(fn) {
  var spy = sinon.spy();
  browser[fn] = function () {
      spy.apply(this, arguments);
      return webdriver.promise.fulfilled();
  };
  return spy;
}

describe('ScreenshotSetup', function() {

  beforeEach(function () {
    browser = {};
    logger = {debug: function() {}};
  });

  it('Should sleep before screenshot', function (done) {
    var screenshotSetup = new ScreenshotSetup({screenshotSleep: 1000}, logger);
    var sleepSpy = spyOnBrowser('sleep');
    screenshotSetup.beforeScreenshot()
        .then(function () {
            expect(sleepSpy.calledOnce).toBeTruthy();
            expect(sleepSpy.calledWith(1000)).toBeTruthy();
            done();
        });
  });

  it('Should hide scrollbars before screenshot', function (done) {
    var screenshotSetup = new ScreenshotSetup({hideScrollbars: 1000}, logger);
    var scriptSpy = spyOnBrowser('executeAsyncScriptHandleErrors');
    screenshotSetup.beforeScreenshot()
        .then(function () {
            expect(scriptSpy.calledOnce).toBeTruthy();
            done();
        });
  });

  it('Should skip steps if none configured', function (done) {
    var screenshotSetup = new ScreenshotSetup({}, logger);
    var sleepSpy = spyOnBrowser('sleep');
    var scriptSpy = spyOnBrowser('executeAsyncScriptHandleErrors');
    screenshotSetup.beforeScreenshot()
        .then(function () {
            expect(sleepSpy.calledOnce).toBeFalsy();
            expect(scriptSpy.calledOnce).toBeFalsy();
            done();
        });
  });
});
