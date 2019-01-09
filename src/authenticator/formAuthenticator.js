
var webdriver = require('selenium-webdriver');

/**
 * Handle page authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function FormAuthenticator(config,instanceConfig,logger,statisticsCollector){
  this.logger = logger;

  this.user = instanceConfig.user;
  this.pass = instanceConfig.pass;
  this.frameSelector = instanceConfig.frameSelector;
  this.userFieldSelector = instanceConfig.userFieldSelector;
  this.passFieldSelector = instanceConfig.passFieldSelector;
  this.logonButtonSelector = instanceConfig.logonButtonSelector;
  this.redirectUrl = instanceConfig.redirectUrl;
  this.statisticsCollector = statisticsCollector;
}

/**
 * Get the page and authenticates with provided credentials
 * @param {string} url - url to get
 * @returns {promise<>} - resolved when the page is full loaded
 */
FormAuthenticator.prototype.get = function(url){

  var that = this;

  if (!this.user || !this.pass) {
    return webdriver.promise.rejected(
      new Error('Form auth requested but user or pass is not specified'));
  }

  // webdriver statements are synchronized by webdriver flow so no need to join the promises

  // open the page
  browser.driver.get(url);

  // wait till redirection is complete and page is fully rendered
  var switchedToFrame = false;
  browser.driver.wait(function(){
    // if auth is in frame => switch inside
    if (that.frameSelector) {
      browser.driver.findElements(by.css(that.frameSelector)).then(function (elements) {
        if (!!elements.length && !switchedToFrame) {
          browser.driver.switchTo().frame(browser.driver.findElement(by.css(that.frameSelector))).then(function () {
            switchedToFrame = true;
          });
        }
      });
    }
    return browser.driver.findElements(by.css(that.userFieldSelector)).then(function (elements) {
      return !!elements.length;
    });
  },browser.getPageTimeout,'Waiting for auth page to fully load');

  // collect login actions separately
  this.statisticsCollector.authStarted();
  // enter user and pass in the respective fields
  browser.driver.findElement(by.css(this.userFieldSelector)).sendKeys(this.user);
  browser.driver.findElement(by.css(this.passFieldSelector)).sendKeys(this.pass);
  browser.driver.findElement(by.css(this.logonButtonSelector)).click().then(function () {
    // wait for all login actions to complete
    that.statisticsCollector.authDone();
  });

  // ensure redirect is completed
  return browser.testrunner.navigation.waitForRedirect(this.redirectUrl || url);
};

module.exports = function (config,instanceConfig,logger,statisticsCollector) {
  return new FormAuthenticator(config,instanceConfig,logger,statisticsCollector);
};
