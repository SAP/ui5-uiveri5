'use strict';

var events = require('events');
var q = require('q');
var selenium_webdriver = require('selenium-webdriver');
var util = require('util');
var browser = require('../browser/browser');
var logger = require('../logger');
var ptor = require('./ptor');
var helper = require('./util');

/*
 * Runner is responsible for starting the execution of a test run and triggering
 * setup, teardown, managing config, etc through its various dependencies.
 *
 * The Protractor Runner is a node EventEmitter with the following events:
 * - testPass
 * - testFail
 * - testsDone
 *
 * @param {Object} config
 * @constructor
 */
function Runner(config, connectionProvider, plugins) {
  events.EventEmitter.apply(this, arguments);
  this.config_ = config;
  this.plugins = plugins;
  this.connectionProvider = connectionProvider;

  if (config.capabilities && config.capabilities.seleniumAddress) {
    config.seleniumAddress = config.capabilities.seleniumAddress;
  }

  this.loadDriverProvider_(config);
  this.setTestPreparer(config.onPrepare);
}

Runner.prototype = Object.assign({}, events.EventEmitter.prototype);
Runner.prototype.constructor = Runner;

/**
 * Responsible for cleaning up test run and exiting the process.
 * @private
 * @param {int} Standard unix exit code
 */
Runner.prototype.exit_ = function (exitCode) {
  return helper.runFilenameOrFn_(this.config_.configDir, this.config_.onCleanUp, [exitCode])
    .then((returned) => {
      if (typeof returned === 'number') {
        return returned;
      }
      else {
        return exitCode;
      }
    });
};

/**
 * Registrar for testPreparers - executed right before tests run.
 * @public
 * @param {string/Fn} filenameOrFn
 */
Runner.prototype.setTestPreparer = function (filenameOrFn) {
  this.preparer_ = filenameOrFn;
};

/**
 * Executor of testPreparer
 * @public
 * @param {string[]=} An optional list of command line arguments the framework will accept.
 * @return {q.Promise} A promise that will resolve when the test preparers
 *     are finished.
 */
Runner.prototype.runTestPreparer = function (extraFlags) {
  var unknownFlags = this.config_.unknownFlags_ || [];
  if (extraFlags) {
    unknownFlags = unknownFlags.filter((f) => extraFlags.indexOf(f) === -1);
  }
  if (unknownFlags.length > 0 && !this.config_.disableChecks) {
    logger.info('Ignoring unknown extra flags: ' + unknownFlags.join(', ') + '. This will be' +
      ' an error in future versions, please use --disableChecks flag to disable the ' +
      ' Protractor CLI flag checks. ');
  }
  return this.plugins.onPrepare().then(() => {
    return helper.runFilenameOrFn_(this.config_.configDir, this.preparer_);
  });
};

/**
 * Called after each test finishes.
 *
 * Responsible for `restartBrowserBetweenTests`
 *
 * @public
 * @return {q.Promise} A promise that will resolve when the work here is done
 */
Runner.prototype.afterEach = function () {
  var ret;
  this.frameworkUsesAfterEach = true;
  if (this.config_.restartBrowserBetweenTests) {
    this.restartPromise = this.restartPromise || q(ptor.protractor.browser.restart());
    ret = this.restartPromise;
    this.restartPromise = undefined;
  }
  return ret || q();
};

/**
 * Grab driver provider based on type
 * @private
 *
 * Priority
 * 1) if directConnect is true, use that
 * 2) if seleniumAddress is given, use that
 * 3) if a Sauce Labs account is given, use that
 * 4) if a seleniumServerJar is specified, use that
 * 5) try to find the seleniumServerJar in protractor/selenium
 */
Runner.prototype.loadDriverProvider_ = function (config) {
  this.config_ = config;
  this.driverprovider_ = this.connectionProvider.buildDriverProvider(this.config_);
};

/**
 * Getter for the Runner config object
 * @public
 * @return {Object} config
 */
Runner.prototype.getConfig = function () {
  return this.config_;
};

/**
 * Get the control flow used by this runner.
 * @return {Object} WebDriver control flow.
 */
Runner.prototype.controlFlow = function () {
  return selenium_webdriver.promise.controlFlow();
};

/**
 * Sets up convenience globals for test specs
 * @private
 */
Runner.prototype.setupGlobals_ = function (browser_) {
  // Keep $, $$, element, and by/By under the global protractor namespace
  ptor.protractor.browser = browser_;
  ptor.protractor.$ = browser_.$;
  ptor.protractor.$$ = browser_.$$;
  ptor.protractor.element = browser_.element;
  ptor.protractor.by = ptor.protractor.By = browser.Browser.By;
  ptor.protractor.ExpectedConditions = browser_.ExpectedConditions;
  if (!this.config_.noGlobals) {
    // Export protractor to the global namespace to be used in tests.
    global.browser = browser_;
    global.$ = browser_.$;
    global.$$ = browser_.$$;
    global.element = browser_.element;
    global.by = global.By = ptor.protractor.By;
    global.ExpectedConditions = ptor.protractor.ExpectedConditions;
  }
  global.protractor = ptor.protractor;
  // Required by dart2js machinery.
  // https://code.google.com/p/dart/source/browse/branches/bleeding_edge/dart/sdk/lib/js/dart2js/js_dart2js.dart?spec=svn32943&r=32943#487
  global.DartObject = function (o) {
    this.o = o;
  };
};

/**
 * Create a new driver from a driverProvider. Then set up a
 * new protractor instance using this driver.
 * This is used to set up the initial protractor instances and any
 * future ones.
 *
 * @param {Plugin} plugins The plugin functions
 * @param {ProtractorBrowser=} parentBrowser The browser which spawned this one
 *
 * @return {Protractor} a protractor instance.
 * @public
 */
Runner.prototype.createBrowser = function (plugins, parentBrowser) {
  var config = this.config_;
  var driver = this.driverprovider_.getNewDriver();
  var initProperties = {
    baseUrl: config.baseUrl,
    rootElement: config.rootElement,
    params: config.params,
    getPageTimeout: config.getPageTimeout,
    allScriptsTimeout: config.allScriptsTimeout
  };
  if (parentBrowser) {
    initProperties.baseUrl = parentBrowser.baseUrl;
    initProperties.params = parentBrowser.params;
    initProperties.getPageTimeout = parentBrowser.getPageTimeout;
    initProperties.allScriptsTimeout = parentBrowser.allScriptsTimeout;
  }
  var browser_ = new browser.Browser(driver, initProperties.baseUrl, initProperties.rootElement);
  browser_.params = initProperties.params;
  browser_.plugins_ = plugins || this.plugins;
  if (initProperties.getPageTimeout) {
    browser_.getPageTimeout = initProperties.getPageTimeout;
  }
  if (initProperties.allScriptsTimeout) {
    browser_.allScriptsTimeout = initProperties.allScriptsTimeout;
  }
  browser_.ready =
    browser_.ready
      .then(() => {
        return driver.manage().timeouts().setScriptTimeout(initProperties.allScriptsTimeout || 0);
      })
      .then(() => {
        return browser_;
      });
  browser_.getProcessedConfig = () => {
    return selenium_webdriver.promise.when(config);
  };
  var replaceBrowser = () => {
    var newBrowser = this.createBrowser(plugins);
    if (browser_ === ptor.protractor.browser) {
      this.setupGlobals_(newBrowser);
    }
    return newBrowser;
  };
  browser_.restart = () => {
    // Note: because tests are not paused at this point, any async
    // calls here are not guaranteed to complete before the tests resume.
    return browser_.restartSync().ready;
  };
  browser_.restartSync = () => {
    this.driverprovider_.quitDriver(browser_.driver);
    return replaceBrowser();
  };
  return browser_;
};

/**
 * Final cleanup on exiting the runner.
 *
 * @return {q.Promise} A promise which resolves on finish.
 * @private
 */
Runner.prototype.shutdown_ = function () {
  return this.driverprovider_.teardownEnv();
};

/**
 * The primary workhorse interface. Kicks off the test running process.
 *
 * @return {q.Promise} A promise which resolves to the exit code of the tests.
 * @public
 */
Runner.prototype.run = function () {
  var testPassed;
  var plugins = this.plugins;
  var browser_;
  var results;
  if (this.config_.framework !== 'explorer' && !this.config_.specs.length) {
    throw new Error('Spec patterns did not match any files.');
  }
  if (this.config_.SELENIUM_PROMISE_MANAGER != null) {
    selenium_webdriver.promise.USE_PROMISE_MANAGER = this.config_.SELENIUM_PROMISE_MANAGER;
  }
  return this.driverprovider_.setupEnv()
    .then(() => {
      // 2) Create a browser and setup globals
      browser_ = this.createBrowser(plugins);
      this.setupGlobals_(browser_);
      return browser_.ready.then(browser_.getSession)
        .then((session) => {
          logger.debug('WebDriver session successfully started with capabilities ' +
            util.inspect(session.getCapabilities()));
        }, (err) => {
          logger.error('Unable to start a WebDriver session.');
          throw err;
        });
      // 3) Setup plugins
    })
    .then(() => {
      return plugins.setup();
      // 4) Execute test cases
    })
    .then(() => {
      // Do the framework setup here so that jasmine globals are
      // available to the onPrepare function.
      if (this.config_.restartBrowserBetweenTests) {
        var restartDriver = () => {
          if (!this.frameworkUsesAfterEach) {
            this.restartPromise = q(browser_.restart());
          }
        };
        this.on('testPass', restartDriver);
        this.on('testFail', restartDriver);
      }
      logger.debug('Running with spec files ' + this.config_.specs);
      var jasmine = require('./frameworks/jasmine');
      return jasmine.run(this, this.config_.specs);
    })
    .then((testResults) => {
      results = testResults;
    })
    .then(() => {
      return plugins.teardown();
      // 7) Teardown
    })
    .then(() => {
      this.emit('testsDone', results);
      testPassed = results.failedCount === 0;
      if (this.driverprovider_.updateJob) {
        return this.driverprovider_.updateJob({ 'passed': testPassed }).then(() => {
          return this.driverprovider_.teardownEnv();
        });
      }
      else {
        return this.driverprovider_.teardownEnv();
      }
    })
    .then(() => {
      var exitCode = testPassed ? 0 : 1;
      return this.exit_(exitCode);
    })
    .catch(function (e) {
      logger.debug('Ptor runner error: ' + e);
    })
    .fin(() => {
      return this.shutdown_();
    });
};

module.exports.Runner = Runner;
