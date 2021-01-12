
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
  this.conditionalLogonButtonSelector = instanceConfig.conditionalLogonButtonSelector;
  this.authorizationButtonSelector = instanceConfig.authorizationButtonSelector;
  this.idpSelector = instanceConfig.idpSelector;
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

  // collect login actions separately
  this.statisticsCollector.authStarted();

  // handle idp selection
  if (this.idpSelector) {
    this._waitForField(this.idpSelector, 'Waiting to redirect to IDP selection page');

    this._getField(this.idpSelector).click().then(function () {
      that.logger.debug('Opening custom login page');
    });
  }

  // wait till redirection is complete and page is fully rendered
  var switchedToFrame = false;
  this._wait(function () {
    // if auth is in frame => switch inside
    if (that.frameSelector) {
      that._isPresent(that.frameSelector).then(function (isDisplayed) {
        if (isDisplayed && !switchedToFrame) {
          browser.driver.switchTo().frame(that._getField(that.frameSelector)).then(function () {
            switchedToFrame = true;
          });
        }
      });
    }
    return that._isPresent(that.userFieldSelector);
  }, 'Waiting to redirect to login page');

  // enter credentials in the respective fields.
  // clear the fields beforehand - there might be prefilled data (e.g. after logout)

  // enter user identifier (email, ID or login name).
  var userField = this._getField(this.userFieldSelector);
  userField.clear();
  userField.sendKeys(this.user);

  // handle conditional login:
  // first a user identifier is entered,
  // then, the id provider is chosen depending on predefined rules for this user
  if (this.conditionalLogonButtonSelector) {
    this._getField(this.conditionalLogonButtonSelector).click().then(function () {
      that.logger.debug('Opening conditional IDP auth page');
    });
    this._waitForField(this.passFieldSelector, 'Wating to redirect to conditional auth page');
  }

  var passField = this._getField(this.passFieldSelector);
  passField.clear();
  passField.sendKeys(this.pass);

  this._getField(this.logonButtonSelector).click();

  // handle reauthorization in github
  // first a user credentials are entered and sign in button is pressed
  // then you authorize the oAuth application
  if (this.authorizationButtonSelector) {
    //this._wait(_waitForAuthorizationButtonEnabled);
    this._wait(function() {
      return that._isPresent(that.authorizationButtonSelector).then(function(isPresent) {
        if (isPresent) {
          return that._getField(that.authorizationButtonSelector).click().then(function() {
            return true;
          });
        }
      });
    },'Explicit authorization was not requested',this.authorizationButtonTimeout).catch(function () {
      // swallow the timeout error as reauthorization is only displayed sometimes
    });
  }
  
  browser.controlFlow().execute(function () {
    that.statisticsCollector.authDone();
  });
  
  // ensure redirect is completed
  return browser.testrunner.navigation.waitForRedirect(this.redirectUrl || url);
};

FormAuthenticator.prototype._wait = function (fnCondition, sTimeoutMessage,iTimeout) {
  return browser.driver.wait(fnCondition, iTimeout || browser.getPageTimeout, sTimeoutMessage);
};

FormAuthenticator.prototype._waitForField = function (sSelector, sTimeoutMessage) {
  var that = this;
  return this._wait(function () {
    return that._isPresent(sSelector);
  }, sTimeoutMessage);
};

FormAuthenticator.prototype._getField = function (sSelector) {
  return browser.driver.findElement(by.css(sSelector));
};

FormAuthenticator.prototype._isPresent = function (sSelector) {
  return browser.driver.findElements(by.css(sSelector)).then(function (aFields) {
    if (aFields.length) {
      return aFields[0].isDisplayed().then(function (isDisplayed) {
        if (isDisplayed) {
          return aFields[0].isEnabled();
        }
      });
    }
  });
};

module.exports = function (config,instanceConfig,logger,statisticsCollector) {
  return new FormAuthenticator(config,instanceConfig,logger,statisticsCollector);
};
