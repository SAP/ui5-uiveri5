
var webdriver = require('selenium-webdriver');

/**
 * Handle page authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function UI5FormAuthenticator(config,instanceConfig,logger,statisticsCollector){
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;

  this.user = instanceConfig.user;
  this.pass = instanceConfig.pass;
  this.userFieldSelector = instanceConfig.userFieldSelector;
  this.passFieldSelector = instanceConfig.passFieldSelector;
  this.logonButtonSelector = instanceConfig.logonButtonSelector;
  this.statisticsCollector = statisticsCollector;
}

/**
 * Get the page and authenticates with provided credentials
 * @param {string} url - url to get
 * @returns {promise<>} - resolved when the page is full loaded
 */
UI5FormAuthenticator.prototype.get = function(url){

  var that = this;

  if (!this.user || !this.pass) {
    return webdriver.promise.rejected(
      new Error('UI5 Form auth requested but user or pass is not specified'));
  }

  // open the page
  browser.driver.get(url);

  // synchronize with UI5 on credentials page
  browser.loadUI5Dependencies();

  // collect login actions separately
  this.statisticsCollector.authStarted();

  // enter user and pass in the respective fields.
  // clear the fields beforehand - there might be prefilled data (e.g. after logout)
  var userField = element(by.css(this.userFieldSelector));
  userField.clear();
  userField.sendKeys(this.user);

  var passField = element(by.css(this.passFieldSelector));
  passField.clear();
  passField.sendKeys(this.pass);

  element(by.css(this.logonButtonSelector)).click().then(function () {
    // wait for all login actions to complete
    that.statisticsCollector.authDone();
  });

  // ensure redirect is completed
  return browser.testrunner.navigation.waitForRedirect(url);
};

module.exports = function(config,instanceConfig,logger,statisticsCollector){
  return new UI5FormAuthenticator(config,instanceConfig,logger,statisticsCollector);
};
