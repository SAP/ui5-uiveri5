var webdriver = require('selenium-webdriver');

/**
 * Handle page authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function GithubAuthenticator(config, instanceConfig, logger, statisticsCollector) {
  this.logger = logger;

  this.user = instanceConfig.user;
  this.pass = instanceConfig.pass;
  this.frameSelector = instanceConfig.frameSelector;
  this.userFieldSelector = instanceConfig.userFieldSelector;
  this.passFieldSelector = instanceConfig.passFieldSelector;
  this.logonButtonSelector = instanceConfig.logonButtonSelector;
  this.conditionalLogonButtonSelector = instanceConfig.conditionalLogonButtonSelector;
  this.idpSelector = instanceConfig.idpSelector;
  this.redirectUrl = instanceConfig.redirectUrl;
  this.statisticsCollector = statisticsCollector;
}

/**
 * Get the page and authenticates with provided credentials
 * @param {string} url - url to get
 * @returns {promise<>} - resolved when the page is full loaded
 */
GithubAuthenticator.prototype.get = function (url) {

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
    this._waitForField(this.idpSelector, 'redirect to default IDP login page');

    this._getField(this.idpSelector).click().then(function () {
      that.logger.debug('Opening custom IDP auth page');
    });
  }

  // wait till redirection is complete and page is fully rendered
  var switchedToFrame = false;
  this._wait(function () {
    // if auth is in frame => switch inside
    if (that.frameSelector) {
      that._getFields(that.frameSelector).then(that._checkDisplayed).then(function (isDisplayed) {
        if (isDisplayed && !switchedToFrame) {
          browser.driver.switchTo().frame(that._getFields(that.frameSelector)).then(function () {
            switchedToFrame = true;
          });
        }
      });
    }
    return that._getFields(that.userFieldSelector).then(that._checkDisplayed);
  }, this.idpSelector ? 'redirect to custom IDP login page' : 'redirect to login page');

  // enter credentials in the respective fields
  // enter user identifier (email, ID or login name)
  this._getField(this.userFieldSelector).sendKeys(this.user);
  this._getField(this.passFieldSelector).sendKeys(this.pass);
  this._getField(this.logonButtonSelector).click().then(function () {
    // wait for all login actions to complete
    that.logger.debug('Login completed');
    var stopProcessing = false;

    function _pressConditionalButton() {
      return function () {
        if (stopProcessing) {
          that.logger.debug("Stop waiting for conditionalLogonButton.");
          return true;
        }
        that._getField(that.conditionalLogonButtonSelector).isEnabled().then(function (enabled) {
          that.logger.debug("Is conditionalLogonButton enabled: (" + enabled + ")");
          if (enabled) {
            //click Authorize button after only after it is enabled
            that._getField(that.conditionalLogonButtonSelector).click().then(function () {
              that.logger.debug('Clicking conditionalLogonButton.');
            });
            stopProcessing = true;
          }
        }).catch(function () {
          that.logger.debug("conditionalLogonButton cannot be found!");
          stopProcessing = true;
        })
      };
    }

    // handle conditional login:
    // first a user credentials are entered and sign in button is pressed
    // then you authorize the oAuth application
    if (that.conditionalLogonButtonSelector) {
      that._wait(_pressConditionalButton()).then(function () {
        that.statisticsCollector.authDone();
      });
    } else {
      that.statisticsCollector.authDone();
    }
  });

  // ensure redirect is completed
  return browser.testrunner.navigation.waitForRedirect(this.redirectUrl || url);
};

GithubAuthenticator.prototype._wait = function (fnCondition, sTimeoutMessage) {
  return browser.driver.wait(fnCondition, browser.getPageTimeout, 'Waiting for auth page to fully load. Step: ' + sTimeoutMessage);
};

GithubAuthenticator.prototype._waitForField = function (sSelector, sTimeoutMessage) {
  var that = this;
  return this._wait(function () {
    return that._getFields(sSelector).then(that._checkDisplayed);
  }, sTimeoutMessage);
};

GithubAuthenticator.prototype._getFields = function (sSelector) {
  return browser.driver.findElements(by.css(sSelector));
};

GithubAuthenticator.prototype._getField = function (sSelector) {
  return browser.driver.findElement(by.css(sSelector));
};

GithubAuthenticator.prototype._checkDisplayed = function (aFields) {
  if (aFields.length) {
    return aFields[0].isDisplayed().then(function (isDisplayed) {
      return isDisplayed;
    });
  }
};

module.exports = function (config, instanceConfig, logger, statisticsCollector) {
  return new GithubAuthenticator(config, instanceConfig, logger, statisticsCollector);
};
