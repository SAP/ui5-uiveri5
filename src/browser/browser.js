var selenium_webdriver = require('selenium-webdriver');
var webdriver_js_extender = require('webdriver-js-extender');
var Command = require('selenium-webdriver/lib/command').Command;
var CommandName = require('selenium-webdriver/lib/command').Name;

// modules copied to UIVeri5
var element = require('../element/element');
var locators = require('../element/locators');

// TODO module to copy from Protractor
var protrDebugger = require('protractor/built/debugger');

// helper modules
var logger = require('../logger');
var elementUtil = require('./elementUtil');
var clientSideScripts = require('../scripts/clientsidescripts');

// consts
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
    // Probably not a driver that can be extended (e.g. gotten using
    // `directConnect: true` in the config)
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
  this.debugHelper = new protrDebugger.DebugHelper(this);
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
 * The same as {@code webdriver.WebDriver.prototype.executeScript},
 * but with a customized description for debugging.
 *
 * @private
 * @param {!(string|Function)} script The script to execute.
 * @param {string} description A description of the command for debugging.
 * @param {...*} var_args The arguments to pass to the script.
 * @returns {!webdriver.promise.Promise.<T>} A promise that will resolve to
 * the scripts return value.
 * @template T
 */
ProtractorBrowser.prototype.executeScriptWithDescription = function (script, description, ...scriptArgs) {
  if (typeof script === 'function') {
    script = 'return (' + script + ').apply(null, arguments);';
  }
  return this.driver.schedule(new Command(CommandName.EXECUTE_SCRIPT)
    .setParameter('script', script)
    .setParameter('args', scriptArgs), description);
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
  var scriptCode = clientSideScripts[scriptName];
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

ProtractorBrowser.prototype.executeAsyncScriptHandleErrors = function executeAsyncScriptLogErrors(scriptName, params) {
  var code = clientsidescripts[scriptName];
  params = params || {};
  browser.controlFlow().execute(function () {
    logger.trace('Execute async script: ' + scriptName + ' with params: ' + JSON.stringify(params));
    logger.dump('Execute async script code: \n' + JSON.stringify(code));
  });
  return browser.executeAsyncScript(code, params)
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
  var code = clientsidescripts[scriptName];
  params = params || {};
  browser.controlFlow().execute(function () {
    logger.trace('Execute script: ' + scriptName + ' with params: ' + JSON.stringify(params));
    logger.dump('Execute script code: \n' + JSON.stringify(code));
  });
  return browser.executeScript(code, params)
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
 * If set to false, Protractor will not wait for UI5
 * tasks to complete before interacting with the browser. This can cause
 * flaky tests, but should be used if, for instance, your app continuously
 * polls an API with $timeout.
 *
 * Call waitForAngularEnabled() without passing a value to read the current
 * state without changing it.
 */
ProtractorBrowser.prototype.waitForAngularEnabled = function (enabled) {
  if (typeof enabled !== 'undefined') {
    this.ignoreSynchronization = !enabled;
  }
  return selenium_webdriver.promise.when(!this.ignoreSynchronization);
};

/**
 * Instruct webdriver to wait until UI5 is interactive.
 * Note that UIVeri5 automatically applies this command before every WebDriver action.
 * @param {string=} opt_description An optional description to be added to webdriver logs.
 * @returns {!webdriver.promise.Promise} A promise that will resolve to the scripts return value.
 */
ProtractorBrowser.prototype.waitForUI5 = function (description) {
  description = description ? ' - ' + description : '';
  if (this.ignoreSynchronization) {
    return this.driver.controlFlow().execute(function () {
      return true;
    }, 'Ignore Synchronization UIVeri5.waitForUI5()');
  }

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
  });
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
  if (this.ignoreSynchronization) {
    return this.driver.navigate().refresh();
  } else {
    return this.executeScriptWithDescription('return window.location.href', 'Protractor.refresh() - getUrl')
      .then(function (href) {
        return this.get(href, opt_timeout);
      }.bind(this));
  }
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
 * Adds a task to the control flow to pause the test and inject helper
 * functions
 * into the browser, so that debugging may be done in the browser console.
 *
 * This should be used under node in debug mode, i.e. with
 * protractor debug <configuration.js>
 *
 * @example
 * While in the debugger, commands can be scheduled through webdriver by
 * entering the repl:
 *   debug> repl
 *   > element(by.input('user')).sendKeys('Laura');
 *   > browser.debugger();
 *   Press Ctrl + c to leave debug repl
 *   debug> c
 *
 * This will run the sendKeys command as the next task, then re-enter the debugger.
 */
ProtractorBrowser.prototype.debugger = function () {
  return this.driver.executeScript(clientSideScripts.installInBrowser)
    .then(function () {
      return selenium_webdriver.promise.controlFlow().execute(function () {
        return protrDebugger;
      }, 'add breakpoint to control flow');
    });
};

/**
 * See browser.explore().
 */
ProtractorBrowser.prototype.enterRepl = function (opt_debugPort) {
  return this.explore(opt_debugPort);
};

/**
 * Beta (unstable) explore function for entering the repl loop from
 * any point in the control flow. Use browser.explore() in your test.
 * Does not require changes to the command line (no need to add 'debug').
 * Note, if you are wrapping your own instance of Protractor, you must
 * expose globals 'browser' and 'protractor' for pause to work.
 *
 * @example
 * element(by.id('foo')).click();
 * browser.explore();
 * // Execution will stop before the next click action.
 * element(by.id('bar')).click();
 *
 * @param {number=} opt_debugPort Optional port to use for the debugging
 * process
 */
ProtractorBrowser.prototype.explore = function (opt_debugPort) {
  var protrDebuggerClientPath = __dirname + '/protrDebugger/clients/explorer.js';
  var onStartFn = function (firstTime) {
    logger.info();
    if (firstTime) {
      logger.info('------- Element Explorer -------');
      logger.info('Starting WebDriver protrDebugger in a child process. Element ' +
        'Explorer is still beta, please report issues at ' +
        'github.com/angular/protractor');
      logger.info();
      logger.info('Type <tab> to see a list of locator strategies.');
      logger.info('Use the `list` helper function to find elements by strategy:');
      logger.info('  e.g., list(by.binding(\'\')) gets all bindings.');
      logger.info();
    }
  };
  this.debugHelper.initBlocking(protrDebuggerClientPath, onStartFn, opt_debugPort);
};

/**
 * Beta (unstable) pause function for debugging webdriver tests. Use
 * browser.pause() in your test to enter the protractor protrDebugger from that
 * point in the control flow.
 * Does not require changes to the command line (no need to add 'debug').
 * Note, if you are wrapping your own instance of Protractor, you must
 * expose globals 'browser' and 'protractor' for pause to work.
 *
 * @example
 * element(by.id('foo')).click();
 * browser.pause();
 * // Execution will stop before the next click action.
 * element(by.id('bar')).click();
 *
 * @param {number=} opt_debugPort Optional port to use for the debugging
 * process
 */
ProtractorBrowser.prototype.pause = function (opt_debugPort) {
  if (this.debugHelper.isAttached()) {
    logger.info('Encountered browser.pause(), but protrDebugger already attached.');
    return selenium_webdriver.promise.when(true);
  }
  var protrDebuggerClientPath = __dirname + '/protrDebugger/clients/wdprotrDebugger.js';
  var onStartFn = function (firstTime) {
    logger.info();
    logger.info('Encountered browser.pause(). Attaching protrDebugger...');
    if (firstTime) {
      logger.info();
      logger.info('------- WebDriver protrDebugger -------');
      logger.info('Starting WebDriver protrDebugger in a child process. Pause is ' +
        'still beta, please report issues at github.com/angular/protractor');
      logger.info();
      logger.info('press c to continue to the next webdriver command');
      logger.info('press ^D to detach protrDebugger and resume code execution');
      logger.info();
    }
  };
  this.debugHelper.init(protrDebuggerClientPath, onStartFn, opt_debugPort);
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

// TODO(cnishina): either remove for loop entirely since this does not export anything
// the user might need since everything is composed (with caveat that this could be a
// potential breaking change) or export the types with `export * from 'selenium-webdriver'`;
/*
 * Mix in other webdriver functionality to be accessible via protractor.
 */
for (var foo in selenium_webdriver) {
  moduleExports[foo] = selenium_webdriver[foo];
}

module.exports = moduleExports;
