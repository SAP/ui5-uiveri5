var _ = require('lodash');
var selenium_webdriver = require('selenium-webdriver');
var webdriver_js_extender = require('webdriver-js-extender');
var Command = require('selenium-webdriver/lib/command').Command;
var CommandName = require('selenium-webdriver/lib/command').Name;

var element = require('../element/element');
var locators = require('../element/locators');
var expectedConditions = require('../element/expectedConditions');
var logger = require('../logger');
var elementUtil = require('./elementUtil');
var clientsideScripts = require('../scripts/clientsidescripts');

var DEFAULT_RESET_URL = 'data:text/html,<html></html>';
var DEFAULT_GET_PAGE_TIMEOUT = 10000;

/**
 * @alias browser
 * @constructor
 * @param {webdriver.WebDriver} webdriver
 * @param {string=} opt_baseUrl A base URL to run get requests against.
 */
var Browser = function (webdriverInstance, opt_baseUrl) {
  var extendWDInstance;
  try {
    extendWDInstance = webdriver_js_extender.extend(webdriverInstance);
  }
  catch (e) {
    // Probably not a driver that can be extended (e.g. gotten using `directConnect: true` in the config)
    extendWDInstance = webdriverInstance;
  }

  // These functions should delegate to the webdriver instance, but should
  // wait for UI5 to sync up before performing the action.
  var methodsToSync = ['getCurrentUrl', 'getPageSource', 'getTitle'];
  // Mix all other driver functionality into Protractor.
  Object.getOwnPropertyNames(selenium_webdriver.WebDriver.prototype).forEach(function (method) {
    if (!this[method] && typeof extendWDInstance[method] === 'function') {
      if (methodsToSync.indexOf(method) === -1) {
        elementUtil.mixin(this, extendWDInstance, method);
      } else {
        elementUtil.mixin(this, extendWDInstance, method, this.waitForUI5.bind(this));
      }
    }
  }.bind(this));

  this.driver = extendWDInstance;

  this.element = elementUtil.buildElementHelper(this);
  this.$ = element.build$(this.element, selenium_webdriver.By);
  this.$$ = element.build$$(this.element, selenium_webdriver.By);

  this.baseUrl = opt_baseUrl || '';
  this.getPageTimeout = DEFAULT_GET_PAGE_TIMEOUT;
  this.params = {};
  this.resetUrl = DEFAULT_RESET_URL;
  this.ExpectedConditions = new expectedConditions.ProtractorExpectedConditions(this);

  var browser = this;
  browser.testrunner = {
    currentSuite: {
      set meta(value) {
        beforeAll(function () {
          browser.controlFlow().execute(function () {
            browser.testrunner.currentSuite._meta = value;
          });
        });
      },
      get meta() {
        return {
          set controlName(value) {
            browser.testrunner.currentSuite.meta = {
              controlName: value
            };
          }
        };
      }
    },
    currentSpec: {
      set meta(value) {
        browser.controlFlow().execute(function () {
          browser.testrunner.currentSpec._meta = value;
        });
      },
      get meta() {
        return browser.testrunner.currentSpec._meta;
      }
    },
    navigation: {
      waitForRedirect: browser._waitForRedirect.bind(browser),
      to: browser._navigateTo.bind(browser),
      _getAuthenticator: function () {
        // override in uiveri5.js - needs moduleLoader and statisticCollector
        return null;
      }
    }
  };

  this.ready = this.driver.getSession()
    .then(function (session) {
      // Internet Explorer does not accept data URLs, which are the default reset URL for Protractor.
      // Safari accepts data urls, but SafariDriver fails after one is used.
      // PhantomJS produces a 'Detected a page unload event' if we use data urls
      var browserName = session.getCapabilities().get('browserName');
      if (['internet explorer', 'safari', 'phantomjs', 'MicrosoftEdge'].indexOf(browserName) > -1) {
        this.resetUrl = 'about:blank';
      }
      return selenium_webdriver.promise.when(this);
    }.bind(this));
};

// publish configs on the browser object
Browser.prototype.setConfig = function (config) {
  this.testrunner.config = config;
};

// export current runtime for tests
Browser.prototype.setRuntime = function (runtime) {
  this.testrunner.runtime = runtime;
};

/**
 * The same as {@code webdriver.WebDriver.prototype.executeAsyncScript} but with extra logging
 *
 * @private
 * @param {string} scriptName A description for debugging purposes.
 * @param {...*} scriptArgs The arguments to pass to the script.
 * @returns {!webdriver.promise.Promise.<T>} A promise that will resolve to the scripts return value.
 * @template T
 */
Browser.prototype._executeAsyncScript = function (scriptName, ...scriptArgs) {
  var scriptCode = clientsideScripts[scriptName];
  var logLevel = scriptName === 'waitForUI5' ? 'trace' : 'debug';
  logger[logLevel]('Execute async script: ' + scriptName + ' with args: ' + JSON.stringify(scriptArgs));
  logger.trace('Execute async script code: \n' + JSON.stringify(scriptCode));

  return this.driver.schedule(new Command(CommandName.EXECUTE_ASYNC_SCRIPT)
    .setParameter('script', scriptCode)
    .setParameter('args', scriptArgs), scriptName)
    .then(function (scriptResult) {
      if (scriptResult && scriptResult.log) {
        logger.trace('Async script: ' + scriptName + ' completed with logs: \n' + scriptResult.log);
      }
      if (scriptResult && scriptResult.error) {
        logger.debug('Async script: ' + scriptName + ' completed with error: ' + JSON.stringify(scriptResult.error));
        throw new Error(scriptName + ': ' + scriptResult.error);
      }
      if (scriptResult && scriptResult.value) {
        logger[logLevel]('Async script: ' + scriptName + ' completed with result: ' + JSON.stringify(scriptResult.value));
        return scriptResult.value;
      } else {
        logger.trace('Async script: ' + scriptName + ' completed with result: ' + JSON.stringify(scriptResult));
        return scriptResult;
      }
    }, function (error) {
      logger.trace('Async script: ' + scriptName + ' completed with error: ' + JSON.stringify(error));
      throw error;
    });
};

Browser.prototype.executeAsyncScriptHandleErrors = function executeAsyncScriptHandleErrors(scriptName, params) {
  var code = clientsideScripts[scriptName];
  params = params || {};
  this.controlFlow().execute(function () {
    logger.trace('Execute async script: ' + scriptName + ' with params: ' + JSON.stringify(params));
    logger.dump('Execute async script code: \n' + JSON.stringify(code));
  });
  return this.executeAsyncScript(code, params)
    .then(function (res) {
      if (res.log) {
        logger.trace('Async script: ' + scriptName + ' logs: \n' + res.log);
      }
      if (res.error) {
        logger.trace('Async script: ' + scriptName + ' error: ' + JSON.stringify(res.error));
        throw new Error(scriptName + ': ' + res.error);
      }
      logger.trace('Async script: ' + scriptName + ' result: ' + JSON.stringify(res.value));
      return res.value;
    });
};

Browser.prototype.executeScriptHandleErrors = function executeScriptHandleErrors(scriptName, params) {
  var code = clientsideScripts[scriptName];
  params = params || {};
  this.controlFlow().execute(function () {
    logger.trace('Execute script: ' + scriptName + ' with params: ' + JSON.stringify(params));
    logger.dump('Execute script code: \n' + JSON.stringify(code));
  });
  return this.executeScript(code, params)
    .then(function (res) {
      if (res.log) {
        logger.trace('Script: ' + scriptName + ' logs: \n' + res.log);
      }
      if (res.error) {
        logger.trace('Script: ' + scriptName + ' error: ' + JSON.stringify(res.error));
        throw new Error(scriptName + ': ' + res.error);
      }
      logger.trace('Script: ' + scriptName + ' result: ' + JSON.stringify(res.value));
      return res.value;
    });
};

/**
 * Instruct webdriver to wait until UI5 is interactive.
 * Note that UIVeri5 automatically applies this command before every WebDriver action.
 * @param {string=} opt_description An optional description to be added to webdriver logs.
 * @returns {!webdriver.promise.Promise} A promise that will resolve to the scripts return value.
 */
Browser.prototype.waitForUI5 = function (description) {
  description = description ? ' - ' + description : '';
  return this.driver.controlFlow().execute(function () {
    return this._executeAsyncScript('waitForUI5');
  }.bind(this)).then(function () {
    logger.trace('UIVeri5 synced with the page');
  }, function (error) {
    var timeout;
    if (/asynchronous script timeout/.test(error.message)) {
      // Timeout on Chrome
      timeout = /-?[\d\.]*\ seconds/.exec(error.message);
    }
    else if (/Timed out waiting for async script/.test(error.message)) {
      // Timeout on Firefox
      timeout = /-?[\d\.]*ms/.exec(error.message);
    }
    else if (/Timed out waiting for an asynchronous script/.test(error.message)) {
      // Timeout on Safari
      timeout = /-?[\d\.]*\ ms/.exec(error.message);
    }
    if (timeout) {
      var errMsg = 'Timed out waiting for asynchronous UI5 tasks to finish after ' + timeout;
      if (description.indexOf(' - Locator: ') === 0) {
        errMsg += '\nWhile waiting for element with locator' + description;
      }
      error.message = errMsg;
    }
    throw error;
  }).then(this.plugins_.onUI5Sync, this.plugins_.onUI5Sync);
};

Browser.prototype.loadUI5Dependencies = function () {
  return this._loadUI5Dependencies().then(function () {
    return this.waitForUI5();
  }.bind(this));
};

Browser.prototype._loadUI5Dependencies = function () {
  var ui5SyncDelta = this.testrunner.config.timeouts && this.testrunner.config.timeouts.waitForUI5Delta;
  var waitForUI5Timeout = ui5SyncDelta > 0 ? (this.testrunner.config.timeouts.allScriptsTimeout - ui5SyncDelta) : 0;

  return this.executeAsyncScriptHandleErrors('loadUI5Dependencies', {
    autoWait: _.extend({
      timeout: waitForUI5Timeout,
      interval: this.testrunner.config.timeouts.waitForUI5PollingInterval
    }, this.testrunner.config.autoWait)
  });
};

Browser.prototype.get = function (sUrl, authConfig) {
  return this.testrunner.navigation.to(sUrl, authConfig);
};

Browser.prototype.setViewportSize = function (viewportSize) {
  return this.executeScriptHandleErrors('getWindowToolbarSize')
    .then(function (toolbarSize) {
      this.driver.manage().window().setSize(
        viewportSize.width * 1 + toolbarSize.width,
        viewportSize.height * 1 + toolbarSize.height); // convert to integer implicitly
    }.bind(this));
};

Browser.prototype.setInitialWindowSize = function () {
  var isMaximized = _.get(this.testrunner.runtime,'capabilities.remoteWebDriverOptions.maximized');
  var remoteWindowPosition = _.get(this.testrunner.runtime,'capabilities.remoteWebDriverOptions.position');
  var remoteViewportSize = _.get(this.testrunner.runtime,'capabilities.remoteWebDriverOptions.viewportSize');
  var remoteBrowserSize = _.get(this.testrunner.runtime,'capabilities.remoteWebDriverOptions.browserSize');
  
  if (isMaximized) {
    logger.debug('Maximizing browser window');
    this.driver.manage().window().maximize();
  } else {
    if (remoteWindowPosition) {
      if (_.some(remoteWindowPosition, _.isUndefined)) {
        throw Error('Setting browser window position: X and Y coordinates required but not specified');
      }
      logger.debug('Setting browser window position: x: ' + remoteWindowPosition.x + ', y: ' + remoteWindowPosition.y);
      this.driver.manage().window().setPosition(remoteWindowPosition.x * 1, remoteWindowPosition.y * 1); // convert to integer implicitly
    }
  
    if (remoteViewportSize) {
      if (_.some(remoteViewportSize, _.isUndefined)) {
        throw Error('Setting browser viewport size: width and height required but not specified');
      }
      logger.debug('Setting browser viewport size: width: ' + remoteViewportSize.width + ', height: ' + remoteViewportSize.height);
      this.setViewportSize(remoteViewportSize);
    } else if (remoteBrowserSize) {
      if (_.some(remoteBrowserSize, _.isUndefined)) {
        throw Error('Setting browser window size: width and height required but not specified');
      }
      logger.debug('Setting browser window size: width: ' + remoteBrowserSize.width + ', height: ' + remoteBrowserSize.height);
      this.driver.manage().window().setSize(remoteBrowserSize.width * 1, remoteBrowserSize.height * 1); // convert to integer implicitly
    }
  }
};

Browser.prototype.logUI5Version = function () {
  return browser.executeScriptHandleErrors('getUI5Version')
    .then(function (versionInfo) {
      logger.info('UI5 Version: ' + versionInfo.version);
      logger.info('UI5 Timestamp: ' + versionInfo.buildTimestamp);
    });
};

Browser.prototype._waitForRedirect = function (targetUrl) {
  // ensure page is fully loaded - wait for window.url to become the same as requested
  return browser.driver.wait(function () {
    return browser.driver.executeScript(function () {
      return window.location.href;
    }).then(function (currentUrl) {
      logger.debug('Waiting for redirect to complete, current url: ' + currentUrl);

      // match only host/port/path as app could manipulate request args and fragment
      var currentUrlMathes = currentUrl.match(/([^\?\#]+)/);
      if (currentUrlMathes == null || !currentUrlMathes[1] || currentUrlMathes[1] == '') {
        throw new Error('Could not parse current url: ' + currentUrl);
      }
      var currentUrlHost = currentUrlMathes[1];
      // strip trailing slashe
      if (currentUrlHost.charAt(currentUrlHost.length - 1) == '/') {
        currentUrlHost = currentUrlHost.slice(0, -1);
      }
      // handle string and regexps
      if (_.isString(targetUrl)) {
        var targetUrlMatches = targetUrl.match(/([^\?\#]+)/);
        if (targetUrlMatches == null || !targetUrlMatches[1] || targetUrlMatches[1] == '') {
          throw new Error('Could not parse target url: ' + targetUrl);
        }
        var targetUrlHost = targetUrlMatches[1];
        // strip trailing slash
        if (targetUrlHost.charAt(targetUrlHost.length - 1) == '/') {
          targetUrlHost = targetUrlHost.slice(0, -1);
        }
        // strip basic auth information
        targetUrlHost = targetUrlHost.replace(/\/\/\S+:\S+@/, '//');

        return currentUrlHost === targetUrlHost;
      } else if (_.isRegExp(targetUrl)) {
        return targetUrl.test(currentUrlHost);
      } else {
        throw new Error('Could not match target url that is neither string nor regexp');
      }
    });
    // 10ms delta is necessary or webdriver crashes and the process stops without exit status
  }, browser.getPageTimeout - 100, 'Waiting for redirection to complete, target url: ' + targetUrl);
};

Browser.prototype._navigateTo = function (url, authConfig) {
  var authenticator = this.testrunner.navigation._getAuthenticator(authConfig);
  if (authenticator) {
    // open page and login
    this.controlFlow().execute(function () {
      logger.info('Opening: ' + url);
    });
    authenticator.get(url);
  }

  // handle pageLoading options
  if (this.testrunner.config.pageLoading) {

    // reload the page immediately if required
    if (this.testrunner.config.pageLoading.initialReload) {
      this.controlFlow().execute(function () {
        logger.debug('Initial page reload requested');
      });
      this.driver.navigate().refresh();
    }

    // wait some time after page is loaded
    if (this.testrunner.config.pageLoading.wait) {
      var wait = this.testrunner.config.pageLoading.wait;
      if (_.isString(wait)) {
        wait = parseInt(wait, 10);
      }

      this.controlFlow().execute(function () {
        logger.debug('Initial page load wait: ' + wait + 'ms');
      });
      this.sleep(wait);
    }
  }

  // load waitForUI5 logic on client and
  // ensure app is fully loaded before starting the interactions
  this.loadUI5Dependencies();

  return this.logUI5Version();
};

/**
 * Wait for UI5 to finish rendering before searching for elements.
 * @see webdriver.WebDriver.findElement
 * @returns {!webdriver.WebElementPromise} A promise that will be resolved to the located {@link webdriver.WebElement}.
 */
Browser.prototype.findElement = function (locator) {
  return this.element(locator).getWebElement();
};

/**
 * Wait for UI5 to finish rendering before searching for elements.
 * @see webdriver.WebDriver.findElements
 * @returns {!webdriver.promise.Promise} A promise that will be resolved to an array of the located {@link webdriver.WebElement}s.
 */
Browser.prototype.findElements = function (locator) {
  return this.element.all(locator).getWebElements();
};

/**
 * Test if an element is present on the page.
 * @see webdriver.WebDriver.isElementPresent
 * @returns {!webdriver.promise.Promise} A promise that will resolve to whether the element is present on the page.
 */
Browser.prototype.isElementPresent = function (locatorOrElement) {
  var element;
  if (locatorOrElement instanceof element.ElementFinder) {
    element = locatorOrElement;
  } else if (locatorOrElement instanceof selenium_webdriver.WebElement) {
    element = element.ElementFinder.fromWebElement_(this, locatorOrElement);
  } else {
    element = this.element(locatorOrElement);
  }
  return element.isPresent();
};

/**
 * @see webdriver.WebDriver.refresh
 *
 * Make a full reload of the current page. Assumes that the page being loaded uses UI5.
 * If you need to access a page which does not have UI5 on load, use the wrapped webdriver directly.
 *
 * @param {number=} opt_timeout Number of milliseconds to wait for UI5 to start.
 */
Browser.prototype.refresh = function (opt_timeout) {
  return this.executeScript('return window.location.href')
    .then(function (href) {
      return this.get(href, opt_timeout);
    }.bind(this));
};

/**
 * Mixin navigation methods back into the navigation object so that
 * they are invoked as before, i.e. driver.navigate().refresh()
 */
Browser.prototype.navigate = function () {
  var nav = this.driver.navigate();
  elementUtil.mixin(nav, this, 'refresh');
  return nav;
};

/**
 * @type {ProtractorBy}
 */
Browser.By = new locators.ProtractorBy();

var moduleExports = {
  Browser: Browser
};

module.exports = moduleExports;
