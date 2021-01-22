var selenium_webdriver = require('selenium-webdriver');
var webdriver_js_extender = require('webdriver-js-extender');
var Command = require('selenium-webdriver/lib/command').Command;
var CommandName = require('selenium-webdriver/lib/command').Name;

var element = require('../element/element');
var locators = require('../element/locators');
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
var ProtractorBrowser = function (webdriverInstance, opt_baseUrl) {
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

/**
 * The same as {@code webdriver.WebDriver.prototype.executeAsyncScript} but with extra logging
 *
 * @private
 * @param {string} scriptName A description for debugging purposes.
 * @param {...*} scriptArgs The arguments to pass to the script.
 * @returns {!webdriver.promise.Promise.<T>} A promise that will resolve to the scripts return value.
 * @template T
 */
ProtractorBrowser.prototype._executeAsyncScript = function (scriptName, ...scriptArgs) {
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

ProtractorBrowser.prototype.executeAsyncScriptHandleErrors = function executeAsyncScriptHandleErrors(scriptName, params) {
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

ProtractorBrowser.prototype.executeScriptHandleErrors = function executeScriptHandleErrors(scriptName, params) {
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
ProtractorBrowser.prototype.waitForUI5 = function (description) {
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

ProtractorBrowser.prototype.enableClickWithActions = function () {
  element.enableClickWithActions();
};

/**
 * Moving mouse to body (-1, -1)
 */
ProtractorBrowser.prototype._moveMouseOutsideBody = function (driverActions) {
  logger.trace('Moving mouse to body (-1, -1).');
  // the implicit synchronization that element() does is important to ensure app is settled before clicking
  var bodyElement = element(by.css('body'));
  return driverActions.mouseMove(bodyElement, {x:-1, y:-1}).perform();
};

// TODO move browser.testrunner and ui5 loading

ProtractorBrowser.prototype.get = function (sUrl, vOptions) {
  return this.testrunner.navigation.to(sUrl, vOptions);
};

ProtractorBrowser.prototype.setViewportSize = function (viewportSize) {
  return this.executeScriptHandleErrors('getWindowToolbarSize')
    .then(function (toolbarSize) {
      this.driver.manage().window().setSize(
        viewportSize.width * 1 + toolbarSize.width,
        viewportSize.height * 1 + toolbarSize.height); // convert to integer implicitly
    }.bind(this));
};

/**
 * Wait for UI5 to finish rendering before searching for elements.
 * @see webdriver.WebDriver.findElement
 * @returns {!webdriver.WebElementPromise} A promise that will be resolved to the located {@link webdriver.WebElement}.
 */
ProtractorBrowser.prototype.findElement = function (locator) {
  return this.element(locator).getWebElement();
};

/**
 * Wait for UI5 to finish rendering before searching for elements.
 * @see webdriver.WebDriver.findElements
 * @returns {!webdriver.promise.Promise} A promise that will be resolved to an array of the located {@link webdriver.WebElement}s.
 */
ProtractorBrowser.prototype.findElements = function (locator) {
  return this.element.all(locator).getWebElements();
};

/**
 * Test if an element is present on the page.
 * @see webdriver.WebDriver.isElementPresent
 * @returns {!webdriver.promise.Promise} A promise that will resolve to whether the element is present on the page.
 */
ProtractorBrowser.prototype.isElementPresent = function (locatorOrElement) {
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
ProtractorBrowser.prototype.refresh = function (opt_timeout) {
  return this.executeScript('return window.location.href')
    .then(function (href) {
      return this.get(href, opt_timeout);
    }.bind(this));
};

/**
 * Mixin navigation methods back into the navigation object so that
 * they are invoked as before, i.e. driver.navigate().refresh()
 */
ProtractorBrowser.prototype.navigate = function () {
  var nav = this.driver.navigate();
  elementUtil.mixin(nav, this, 'refresh');
  return nav;
};

/**
 * Fork another instance of browser for use in interactive tests.
 *
 * @example
 * // Running with control flow enabled
 * var fork = browser.forkNewDriverInstance();
 * fork.get('page1'); // 'page1' gotten by forked browser
 *
 * // Running with control flow disabled
 * var forked = await browser.forkNewDriverInstance().ready;
 * await forked.get('page1'); // 'page1' gotten by forked browser
 *
 * @param {boolean=} useSameUrl Whether to navigate to current url on creation
 * @param {boolean=} copyMockModules Whether to apply same mock modules on creation
 * @param {boolean=} copyConfigUpdates Whether to copy over changes to `baseUrl` and similar
 *   properties initialized to values in the the config.  Defaults to `true`
 *
 * @returns {ProtractorBrowser} A browser instance.
 */
ProtractorBrowser.prototype.forkNewDriverInstance = function (/*useSameUrl, copyMockModules, copyConfigUpdates = true*/) {
  return null;
};

/**
 * Determine if the control flow is enabled.
 *
 * @returns true if the control flow is enabled, false otherwise.
 */
ProtractorBrowser.prototype.controlFlowIsEnabled = function () {
  if (typeof selenium_webdriver.promise.USE_PROMISE_MANAGER === 'undefined') {
    // True for old versions of `selenium-webdriver`, probably false in >=5.0.0
    return !!selenium_webdriver.promise.ControlFlow;
  } else {
    return selenium_webdriver.promise.USE_PROMISE_MANAGER;
  }
};

/**
 * @type {ProtractorBy}
 */
ProtractorBrowser.By = new locators.ProtractorBy();

var moduleExports = {
  ProtractorBrowser: ProtractorBrowser
};

module.exports = moduleExports;
