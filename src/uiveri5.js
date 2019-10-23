var _ = require('lodash');
var proxyquire = require('proxyquire');
var url = require('url');
var path = require('path');
var clientsidescripts = require('./scripts/clientsidescripts');
var Control = require('./control');
var pageObjectFactory = require('./pageObjectFactory');
var systemUtil = require('./util/system');
var plugin = require('./plugin');
var logger = require('./logger')(true);
var browserMixin = require('./browser');
var testrunner = require('./testrunner');

var DEFAULT_CONNECTION_NAME = 'direct';

/**
 * @typedef Config
 * @type {Object}
 * @property {String} specResolver - spec resolver to use, defaults to: localSpecResolver for profile
 *  integration and localUI5SpecResolver for profile visual
 * @property {String} conf - config file to use, defaults to: '../conf/default.conf.js'
 *  that contains only: profile: 'visual'
 * @property {String} profile - used to resolve profile config file with pattern: '../conf/<profile>.conf.js,
 *  no profile resolved if undefined, defaults to: visual if default.conf.js loaded
 * @property {number} verbose - verbose level, 0 shows only info, 1 shows debug,
 *  2 shows waitForUI5 executions,3 shows also waitForUI5 script content, defaults t: 0
 * @property {<BrowserCapability|String}>[]} browsers - list of browsers to drive. Single word is assumed to
 *  be browserName, supports column delimited and json formats, overwrites *.conf.js values, defaults to: 'chrome'
 * @property {Object} params - params object to be passed to the tests
 * @property {boolean} ignoreSync - disables waitForUI5 synchronization, defaults to: false
 * @property {boolean} useClassicalWaitForUI5 - use classical version of waitForUI5, defaults to: false
 */

/**
 * Runs visual tests
 * @param {Config} config - configs
 * @return {Promise} resolved on success or rejected with error 
 */
function run(config) {
  /*
   * parse and log config
   */

  logger.info(systemUtil.getUIVeri5Version());
  logger.debug('Config from command-line: ${JSON.stringify(config)}', {config: config});

  config = _mergeInConfigFiles(config);

  logger.setLevel(config.verbose);
  logger.debug('Config after resolving config file and profile: ${JSON.stringify(config)}', {config: config});
  logger.debug('Current working directory: ' + process.cwd());

  // start module loader
  var moduleLoader = require('./moduleLoader')(config,logger);

  var pluginLoader = plugin(moduleLoader);

  /*
   * resolve specs
   */

  var specResolver = moduleLoader.loadModule('specResolver');
  logger.info('Resolving specs');
  return specResolver.resolve().then(function(specs){
    if (!(specs && specs.length)) {
      throw Error('No specs found');
    }

    // resolve connection
    var connectionName = config.connection || DEFAULT_CONNECTION_NAME;
    var connectionConfig = config.connectionConfigs[connectionName];
    if (!connectionConfig){
      throw Error('Could not find connection: ' + connectionName);
    }

    // create connectionProvider
    var connectionProvider = moduleLoader.loadNamedModule('connection');

    // prepare protractor executor args
    var protractorArgv = _createProtractorArgv(connectionProvider, config);

    _copyTimeouts(config, protractorArgv);

    /*
     * replace angular-specific browser scripts, provided by protractor, with UIVeri5 browser scripts
    */
    proxyquire('protractor/built/browser', {
      './clientsidescripts': clientsidescripts
    });
    proxyquire('protractor/built/element', {
      './clientsidescripts': clientsidescripts
    });
    proxyquire('protractor/built/locators', {
      './clientsidescripts': clientsidescripts
    });

    protractorArgv.specs = specs.map(function (spec) {
      return spec.testPath;
    });

    // register page object factory on global scope
    logger.debug('Loading BDD-style page object factory');
    pageObjectFactory.register(global);

    protractorArgv.plugins = pluginLoader.loadRunnerPlugins();

    // execute after test env setup and just before test execution starts
    protractorArgv.onPrepare = function () {

      var matchers = {};
      var storageProvider;

      // register a hook to be called after webdriver is created ( may not be connected yet )
      browser.getProcessedConfig().then(function (protractorConfig) {
        var runtime = connectionProvider.resolveRuntimeFromCapabilities(protractorConfig.capabilities);
        logger.debug('Runtime resolved from capabilities: ' + JSON.stringify(runtime));

        // export current runtime for tests
        browser.testrunner.runtime = runtime;

        // register screenshot provider
        var screenshotProvider = moduleLoader.loadModuleIfAvailable('screenshotProvider', [runtime]);
        if (screenshotProvider) {
          screenshotProvider.register();
        }

        // load storage provider
        storageProvider = moduleLoader.loadModuleIfAvailable('storageProvider', [runtime]);

        // load comparison provider and register the custom matcher
        var comparisonProvider = moduleLoader.loadModuleIfAvailable('comparisonProvider', [storageProvider]);
        if (comparisonProvider) {
          comparisonProvider.register(matchers);
        }

        moduleLoader.loadModuleIfAvailable('matchers', []).forEach(function(matcher){
          matcher.register(matchers);
        });

        // process remoteWebDriverOptions
        _setBrowserSize(runtime);

        protractorModule.parent.exports.ElementFinder.prototype.asControl = function () {
          return new Control(this.elementArrayFinder_);
        };

        // add WebDriver overrides
        if (runtime.capabilities.enableClickWithActions) {
          logger.debug('Activating WebElement.click() override with actions');
          protractorModule.parent.parent.exports.WebElement.prototype.click = function () {
            logger.trace('Taking over WebElement.click()');
            var driverActions = this.driver_.actions().mouseMove(this).click();
            return _moveMouseOutsideBody(driverActions);
          };
        }

      });

      browserMixin(browser, config, logger).augmentBrowser();

      // add global matchers
      beforeEach(function() {
        jasmine.getEnv().addMatchers(matchers);
      });

      // add additional locators
      moduleLoader.loadModule('locators').forEach(function(locator){
        locator.register(by);
      });

      // hook into specs lifecycle
      // open test content page before every suite
      jasmine.getEnv().addReporter({

        jasmineStarted: function(){
          // call storage provider beforeAll hook
          if (storageProvider && storageProvider.onBeforeAllSpecs){
            storageProvider.onBeforeAllSpecs(specs);
          }
        },

        //TODO consider several describe() per spec file
        suiteStarted: function(result){

          // enclose all WebDriver operations in a new flow for a gracefull handlong of failures
          // will call jasmine.fail() that will handle the error
          browser.controlFlow().execute(function() {

            var specFullName = result.description;
            var spec = _getSpecByFullName(specs, specFullName);
            if (!spec) {
              fail(new Error('Spec with full name: ' + specFullName + ' not found'));
              return;
            }

            // open content page if required
            if (!spec.contentUrl) {
              logger.debug('Skip content page opening');
              return;
            }

            // webdriverjs operations are inherently synchronized by webdriver flow
            // so no need to synchronize manually with callbacks/promises

            // add request params
            var specUrl = url.parse(spec.contentUrl);
            if (config.baseUrlQuery && config.baseUrlQuery.length >0){
              if (specUrl.search == null) {
                specUrl.search = '';
              }
              config.baseUrlQuery.forEach(function(value,index){
                if (index > 0){
                  specUrl.search += '&';
                }
                specUrl.search += value;
              });
            }

            // open test page
            var specUrlString = url.format(specUrl);
            browser.testrunner.navigation.to(specUrlString).then(function () {
              // call storage provider beforeEach hook
              if (storageProvider && storageProvider.onBeforeEachSpec) {
                storageProvider.onBeforeEachSpec(spec);
              }
              if (browser.testrunner.runtime.capabilities.enableClickWithActions) {
                _moveMouseOutsideBody(browser.driver.actions());
              }
            });
          }).catch(function(error){
            // the failure in reporter -> beforeAll will not stop further suite execution !
            // fail-fast was discussed here -> https://github.com/jasmine/jasmine/issues/778
            // stop the suite will require jasmin 3.0 -> https://github.com/jasmine/jasmine/issues/414
            // stop the spec when error require jasmin 2.4 -> https://jasmine.github.io/2.4/node.html#section-13
            // completing of this functionality in jasmine 2.8 -> https://github.com/jasmine/jasmine/issues/577
            // In jasmine 2.3 a throwOnExpectationFailure(true) was added -> https://stackoverflow.com/questions/22119193/stop-jasmine-test-after-first-expect-fails
            // it does not make sense for us at it simply throws error from the first failed expectation and this kills the whole execution
            fail(error);
          });
        },

        suiteDone: function(result){
          var specFullName = result.description;
          var spec = _getSpecByFullName(specs, specFullName);
          // call storage provider afterEach hook
          if (storageProvider && storageProvider.onAfterEachSpec){
            storageProvider.onAfterEachSpec(spec);
          }
          // if (config.restartBrowserBetweenSuites) {
          // don't restart after last test!
          console.log("==================");
          // use sync because our jasmine version doesn't support promises in suiteDone; also this works with control flow;
          // setups default protractor globals
          browser.restartSync();
          // attach our stuff to the new browser
          testrunner(browser, config, logger, moduleLoader, statisticCollector);
          browserMixin(browser, config, logger).augmentBrowser();
          browser.getProcessedConfig().then(function (protractorConfig) {
            var runtime = connectionProvider.resolveRuntimeFromCapabilities(protractorConfig.capabilities);
            logger.debug('Runtime resolved from capabilities: ' + JSON.stringify(runtime));
            // export current runtime for tests
            browser.testrunner.runtime = runtime;
          });
          //   // if restartBrowserBetweenTests is enabled... -> our config will be missing
          //   // => error: cannot read runtime of undefined in jasmineDone
          // }
        },

        jasmineDone: function(){
          // call storage provider afterAll hook
          if (storageProvider && storageProvider.onAfterAllSpecs){
            storageProvider.onAfterAllSpecs(specs);
          }
        }
      });

      // initialize statistic collector
      var statisticCollector = require('./statisticCollector')();
      jasmine.getEnv().addReporter({
        jasmineStarted: function(){
          statisticCollector.jasmineStarted();
        },
        suiteStarted: function(jasmineSuite){
          statisticCollector.suiteStarted(jasmineSuite);
        },
        specStarted: function(jasmineSpec){
          statisticCollector.specStarted(jasmineSpec);
        },
        specDone: function(jasmineSpec){
          statisticCollector.specDone(jasmineSpec, browser.testrunner.currentSpec._meta);
          delete browser.testrunner.currentSpec._meta;
        },
        suiteDone: function(jasmineSuite){
          statisticCollector.suiteDone(jasmineSuite, browser.testrunner.currentSuite._meta);
          delete browser.testrunner.currentSuite._meta;
        },
        jasmineDone: function(){
          statisticCollector.jasmineDone({runtime:browser.testrunner.runtime});
        }
      });

      testrunner(browser, config, logger, moduleLoader, statisticCollector);

      jasmine.getEnv().addReporter(pluginLoader.loadJasminePlugins());

      // register reporters
      var jasmineEnv = jasmine.getEnv();
      moduleLoader.loadModule('reporters',[statisticCollector]).forEach(function(reporter){
        reporter.register(jasmineEnv);
      });
    };

    protractorArgv.afterLaunch = function(){
      // teardown connection provider env
      logger.debug('Tearing down connection provider environment');
      return connectionProvider.teardownEnv();
    };

    logger.debug('Setting up connection provider environment');
    return connectionProvider.setupEnv().then(function () {
      logger.info('Executing ' + specs.length + ' specs');
      var protractorLauncher = require('protractor/built/launcher');
      protractorLauncher.init(null, protractorArgv);
    });
  });
}


////////////////////////////////////////////////////////////////////////////

function _mergeInConfigFiles(config) {
  var configParser = require('./configParser')(logger);
  var mergedConfig = configParser.mergeConfigs(config);

  mergedConfig.osTypeString = systemUtil.getOSTypeString();

  // resolve runtime and set browsers with capabilities
  var runtimeResolver = require('./runtimeResolver')(mergedConfig,logger);
  mergedConfig.runtimes = runtimeResolver.resolveRuntimes();

  configParser.resolvePlaceholders(mergedConfig);

  return mergedConfig;
}

function _createProtractorArgv(connectionProvider, config) {
  var connectionArgv = connectionProvider.buildProtractorArgv();
  var multiCapabilities = config.runtimes.map(function(runtime){
    // prepare capabilities from runtime for this specific connection type
    return connectionProvider.resolveCapabilitiesFromRuntime(runtime);
  });

  logger.debug('Resolved protractor multiCapabilities from runtime: ' + JSON.stringify(multiCapabilities));

  return _.extend({}, connectionArgv, {
    troubleshoot: config.verbose > 0, // enable protractor debug logs
    baseUrl: config.baseUrl,
    framework: 'jasmine2', // use jasmine 2.0
    // export protractor module object as global.protractorModule
    beforeLaunch: path.join(__dirname, '/beforeLaunchHandler'),
    multiCapabilities: multiCapabilities,
    // no way to implement concurrent executions with current driverProvider impl
    maxSessions: 1,
    jasmineNodeOpts: {
      // disable default jasmine console reporter
      print: function() {}
    }
  });
}

function _copyTimeouts(source, destination) {
  if (source.timeouts){
    if (source.timeouts.getPageTimeout){
      var getPageTimeout = source.timeouts.getPageTimeout;
      if(_.isString(getPageTimeout)){
        getPageTimeout = parseInt(getPageTimeout,10);
      }
      logger.debug('Setting getPageTimeout: ' + getPageTimeout);
      destination.getPageTimeout = getPageTimeout;
    }
    if (source.timeouts.allScriptsTimeout){
      var allScriptsTimeout = source.timeouts.allScriptsTimeout;
      if(_.isString(allScriptsTimeout)){
        allScriptsTimeout = parseInt(allScriptsTimeout,10);
      }
      logger.debug('Setting allScriptsTimeout: ' + allScriptsTimeout);
      destination.allScriptsTimeout = allScriptsTimeout;
    }
    if (source.timeouts.defaultTimeoutInterval){
      var defaultTimeoutInterval = source.timeouts.defaultTimeoutInterval;
      if(_.isString(defaultTimeoutInterval)){
        defaultTimeoutInterval = parseInt(defaultTimeoutInterval,10);
      }
      logger.debug('Setting defaultTimeoutInterval: ' + defaultTimeoutInterval);
      destination.jasmineNodeOpts.defaultTimeoutInterval = defaultTimeoutInterval;
    }
  }

  return destination;
}

// inside a collection of specs, find a spec with given fullName
function _getSpecByFullName(specs, specFullName) {
  var specIndex = specs.map(function (spec) {
    return spec.fullName;
  }).indexOf(specFullName);

  return specIndex > -1 ? specs[specIndex] : null;
}

function _setBrowserSize(runtime) {
  var isMaximized = _.get(runtime.capabilities.remoteWebDriverOptions, 'maximized');
  var remoteWindowPosition = _.get(runtime.capabilities.remoteWebDriverOptions, 'position');
  var remoteViewportSize = _.get(runtime.capabilities.remoteWebDriverOptions, 'viewportSize');
  var remoteBrowserSize = _.get(runtime.capabilities.remoteWebDriverOptions, 'browserSize');

  if (isMaximized) {
    logger.debug('Maximizing browser window');
    browser.driver.manage().window().maximize();
  } else {
    if (remoteWindowPosition) {
      if (_.some(remoteWindowPosition, _.isUndefined)) {
        throw Error('Setting browser window position: X and Y coordinates required but not specified');
      }
      logger.debug('Setting browser window position: x: ' + remoteWindowPosition.x + ', y: ' + remoteWindowPosition.y);
      browser.driver.manage().window().setPosition(remoteWindowPosition.x * 1, remoteWindowPosition.y * 1); // convert to integer implicitly
    }

    if (remoteViewportSize) {
      if (_.some(remoteViewportSize, _.isUndefined)) {
        throw Error('Setting browser viewport size: width and height required but not specified');
      }
      logger.debug('Setting browser viewport size: width: ' + remoteViewportSize.width + ', height: ' + remoteViewportSize.height);
      browser.setViewportSize(remoteViewportSize);
    } else if (remoteBrowserSize) {
      if (_.some(remoteBrowserSize, _.isUndefined)) {
        throw Error('Setting browser window size: width and height required but not specified');
      }
      logger.debug('Setting browser window size: width: ' + remoteBrowserSize.width + ', height: ' + remoteBrowserSize.height);
      browser.driver.manage().window().setSize(remoteBrowserSize.width * 1, remoteBrowserSize.height * 1); // convert to integer implicitly
    }
  }
}

/**
 * Moving mouse to body (-1, -1) - outside the top left corner
 * This ensures that the mouse won't accidentally hover over an element
 */
function _moveMouseOutsideBody(driverActions) {
  logger.trace('Moving mouse to body (-1, -1).');
  // the implicit synchronization that element() does is important to ensure app is settled before clicking
  var bodyElement = element(by.css('body'));
  return driverActions.mouseMove(bodyElement, {x:-1, y:-1}).perform();
}

exports.run = run;

function restart (config) {
  //config should already be parsed and populated in run()
}
