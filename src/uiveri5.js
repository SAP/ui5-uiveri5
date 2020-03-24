
var fs = require('fs');
var _ = require('lodash');
var proxyquire =  require('proxyquire');
var url = require('url');
var UIVeri5Browser = require('./browser/browser');
var clientsidescripts = require('./scripts/clientsidescripts');
var ClassicalWaitForUI5 = require('./scripts/classicalWaitForUI5');
var pageObjectFactory = require('./pageObjectFactory');
var Plugins = require('./plugins/plugins');
var logger = require('./logger');

var DEFAULT_CONNECTION_NAME = 'direct';
var AUTH_CONFIG_NAME = 'auth';

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

  logger.setLevel(config.verbose);

  proxyquire('protractor/built/ptor', {
    './browser': UIVeri5Browser
  });
  proxyquire('protractor/built/runner', {
    './browser': UIVeri5Browser
  });
  proxyquire('protractor/built/index', {
    './browser': UIVeri5Browser
  });

  // log framework version
  var pjson = require('../package.json');
  logger.info(pjson.name + ' v' + pjson.version);

  // log config object so far
  logger.debug('Config from command-line: ${JSON.stringify(config)}',{config:config});

  // merge in config files
  var configParser = require('./configParser')(logger);
  config = configParser.mergeConfigs(config);

  config.osTypeString = (function() {
    var os = require('os');
    var osType = '';

    if (os.type() == 'Darwin') {
      osType = 'mac64';
    } else if (os.type() == 'Linux') {
      if (os.arch() == 'x64') {
        osType = 'linux64';
      } else {
        osType = 'linux32';
      }
    } else if (os.type() == 'Windows_NT') {
      osType = 'win32';
    } else {
      osType = 'unknown';
    }

    return osType;
  })();

  // start module loader
  var moduleLoader = require('./moduleLoader')(config,logger);

  var plugins = new Plugins(moduleLoader.loadModule('plugins'));

  // resolve runtime and set browsers with capabilities
  var runtimeResolver = require('./runtimeResolver')(config,logger);
  config.runtimes = runtimeResolver.resolveRuntimes();

  // resolve all placeholders in config
  configParser.resolvePlaceholders(config);

  // update logger with resolved configs
  logger.setLevel(config.verbose);

  // log config object so far
  logger.debug('Config after resolving config file and profile: ${JSON.stringify(config)}',{config:config});

  // log cwd
  logger.debug('Current working directory: ' + process.cwd());

  // load spec resolver
  var specResolver = moduleLoader.loadModule('specResolver');

  // resolve specs.
  // specs refers to the collection of found .spec.js files (a file containing Jasmine suites)
  logger.info('Resolving specs');
  return specResolver.resolve().then(function(specs){
    if (!specs || specs.length==0){
      throw Error('No specs found');
    }

    // resolve connection
    var connectionName = config.connection || DEFAULT_CONNECTION_NAME;
    var connectionConfig = config.connectionConfigs[connectionName];
    if (!connectionConfig){
      throw Error('Could not find connection: ' + connectionName);
    }

    // create connectionProvider
    var connectionProvider = moduleLoader.loadNamedModule('connection', [plugins]);

    // prepare protractor executor args
    var protractorArgv = connectionProvider.buildProtractorArgv();
    plugins.loadProtractorPlugins(protractorArgv);

    // enable protractor debug logs
    protractorArgv.troubleshoot = config.verbose>0;

    // add baseUrl
    protractorArgv.baseUrl = config.baseUrl;

    // use jasmine 2.0
    protractorArgv.framework = 'jasmine2';
    protractorArgv.jasmineNodeOpts = {};

    // disable default jasmine console reporter
    protractorArgv.jasmineNodeOpts.print = function() {};

    // copy timeouts
    if (config.timeouts){
      if (config.timeouts.getPageTimeout){
        var getPageTimeout = config.timeouts.getPageTimeout;
        if(_.isString(getPageTimeout)){
          getPageTimeout = parseInt(getPageTimeout,10);
        }
        logger.debug('Setting getPageTimeout: ' + getPageTimeout);
        protractorArgv.getPageTimeout = getPageTimeout;
      }
      if (config.timeouts.allScriptsTimeout){
        var allScriptsTimeout = config.timeouts.allScriptsTimeout;
        if(_.isString(allScriptsTimeout)){
          allScriptsTimeout = parseInt(allScriptsTimeout,10);
        }
        logger.debug('Setting allScriptsTimeout: ' + allScriptsTimeout);
        protractorArgv.allScriptsTimeout = allScriptsTimeout;
      }
      if (config.timeouts.defaultTimeoutInterval){
        var defaultTimeoutInterval = config.timeouts.defaultTimeoutInterval;
        if(_.isString(defaultTimeoutInterval)){
          defaultTimeoutInterval = parseInt(defaultTimeoutInterval,10);
        }
        logger.debug('Setting defaultTimeoutInterval: ' + defaultTimeoutInterval);
        protractorArgv.jasmineNodeOpts.defaultTimeoutInterval = defaultTimeoutInterval;
      }
    }

    var ui5SyncDelta = config.timeouts && config.timeouts.waitForUI5Delta;
    var waitForUI5Timeout = ui5SyncDelta > 0 ? (config.timeouts.allScriptsTimeout - ui5SyncDelta) : 0;

    // set specs
    protractorArgv.specs = [];
    specs.forEach(function(spec){
      protractorArgv.specs.push(spec.testPath);
    });

    // resolve browsers capabilities from runtime
    protractorArgv.multiCapabilities = config.runtimes.map(function(runtime){
      // prepare capabilities from runtime for this specific connection type
      return connectionProvider.resolveCapabilitiesFromRuntime(runtime);
    });
    logger.debug('Resolved protractor multiCapabilities: ' +
      JSON.stringify(protractorArgv.multiCapabilities));

    // no way to implement concurrent executions with current driverProvider impl
    protractorArgv.maxSessions = 1;

    // export protractor module object as global.protractorModule
    protractorArgv.beforeLaunch = __dirname + '/beforeLaunchHandler';

    // execute after test env setup and just before test execution starts
    protractorArgv.onPrepare = function () {
      plugins.loadJasminePlugins();

      // publish configs on protractor's browser object
      browser.testrunner = {};
      browser.testrunner.config = config;

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
        var isMaximized = _.get(runtime,'capabilities.remoteWebDriverOptions.maximized');
        var remoteWindowPosition = _.get(runtime,'capabilities.remoteWebDriverOptions.position');
        var remoteViewportSize = _.get(runtime,'capabilities.remoteWebDriverOptions.viewportSize');
        var remoteBrowserSize = _.get(runtime,'capabilities.remoteWebDriverOptions.browserSize');

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

        // add WebDriver overrides
        var enableClickWithActions = _.get(runtime.capabilities.remoteWebDriverOptions, 'enableClickWithActions');
        if (enableClickWithActions) {
          logger.debug('Activating WebElement.click() override with actions');
          protractorModule.parent.parent.exports.WebElement.prototype.click = function () {
            logger.trace('Taking over WebElement.click()');
            var driverActions = this.driver_.actions().mouseMove(this).click();
            return _moveMouseOutsideBody(driverActions);
          };
        }

      });

      browser.loadUI5Dependencies = function () {
        return browser._loadUI5Dependencies().then(function () {
          return browser.waitForUI5();
        });
      };

      browser._loadUI5Dependencies = function () {
        return browser.executeAsyncScriptHandleErrors('loadUI5Dependencies', {
          autoWait: _.extend({
            timeout: waitForUI5Timeout,
            interval: config.timeouts.waitForUI5PollingInterval
          }, config.autoWait),
          ClassicalWaitForUI5: ClassicalWaitForUI5,
          useClassicalWaitForUI5: config.useClassicalWaitForUI5
        });
      };

      browser.get = function (sUrl, vOptions) {
        return browser.testrunner.navigation.to(sUrl, vOptions);
      };

      browser.setViewportSize = function (viewportSize) {
        return browser.executeScriptHandleErrors('getWindowToolbarSize')
          .then(function (toolbarSize) {
            browser.driver.manage().window().setSize(
              viewportSize.width * 1 + toolbarSize.width,
              viewportSize.height * 1 + toolbarSize.height); // convert to integer implicitly
          });
      };

      // add global matchers
      beforeEach(function() {
        jasmine.getEnv().addMatchers(matchers);
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

          // enclose all WebDriver operations in a new flow for a gracefull handling of failures
          // will call jasmine.fail() that will handle the error
          browser.controlFlow().execute(function() {

            var spec = _getSpecDetails(result);
            var contentUrl = spec ? spec.contentUrl : config.baseUrl;
            
            // open content page if required
            if (!contentUrl) {
              logger.debug('Skip content page opening');
              return;
            }

            // webdriverjs operations are inherently synchronized by webdriver flow
            // so no need to synchronize manually with callbacks/promises

            // add request params
            var specUrl = url.parse(contentUrl);
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
              if (_.get(browser.testrunner.runtime,'capabilities.remoteWebDriverOptions.enableClickWithActions')) {
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
          var spec = _getSpecDetails(result);
          // call storage provider afterEach hook
          if (spec && storageProvider && storageProvider.onAfterEachSpec){
            storageProvider.onAfterEachSpec(spec);
          }
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

      if (config.exportParamsFile) {
        jasmine.getEnv().addReporter({
          jasmineDone: function () {
            logger.debug('Exporting test params to file ' + config.exportParamsFile);
            fs.writeFileSync(config.exportParamsFile, JSON.stringify(browser.testrunner.config.exportParams, null, 2));
          }
        });
      }

      var authConfigModule;
      // expose navigation helpers to tests
      browser.testrunner.navigation = {
        to: function(url, authConfig) {
          var authenticator;
          if (authConfig) {
            // programatically invoked authentication - load auth module every time
            authenticator =  moduleLoader.loadNamedModule(authConfig, [statisticCollector]);
          } else {
            // auth is declared in config - load the (global) auth module only once.
            // when authOnce is enabled, auth should be done only once - before the first spec file.
            if (authConfigModule) {
              authenticator = config.authOnce ? null : authConfigModule;
            } else {
              authenticator = authConfigModule = moduleLoader.loadNamedModule(AUTH_CONFIG_NAME, [statisticCollector]);
            }
          }

          if (authenticator) {
            // open page and login
            browser.controlFlow().execute(function () {
              logger.info('Opening: ' + url);
            });
            authenticator.get(url);
          }

          // handle pageLoading options
          if (config.pageLoading) {

            // reload the page immediately if required
            if (config.pageLoading.initialReload) {
              browser.controlFlow().execute(function () {
                logger.debug('Initial page reload requested');
              });
              browser.driver.navigate().refresh();
            }

            // wait some time after page is loaded
            if (config.pageLoading.wait) {
              var wait = config.pageLoading.wait;
              if (_.isString(wait)) {
                wait = parseInt(wait, 10);
              }

              browser.controlFlow().execute(function () {
                logger.debug('Initial page load wait: ' + wait + 'ms');
              });
              browser.sleep(wait);
            }
          }

          // load waitForUI5 logic on client and
          // ensure app is fully loaded before starting the interactions
          browser.loadUI5Dependencies();

          // log UI5 version
          return browser.executeScriptHandleErrors('getUI5Version')
            .then(function (versionInfo) {
              logger.info('UI5 Version: ' + versionInfo.version);
              logger.info('UI5 Timestamp: ' + versionInfo.buildTimestamp);
            });
        },

        waitForRedirect: function(targetUrl){
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
              if(currentUrlHost.charAt(currentUrlHost.length - 1) == '/') {
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
                if(targetUrlHost.charAt(targetUrlHost.length - 1) == '/') {
                  targetUrlHost = targetUrlHost.slice(0, -1);
                }
                // strip basic auth information
                targetUrlHost = targetUrlHost.replace(/\/\/\S+:\S+@/, '//');

                return  currentUrlHost === targetUrlHost;
              } else if (_.isRegExp(targetUrl)) {
                return targetUrl.test(currentUrlHost);
              } else {
                throw new Error('Could not match target url that is neither string nor regexp');
              }
            });
          }, browser.getPageTimeout - 100,'Waiting for redirection to complete, target url: ' + targetUrl); 
          // 10ms delta is necessary or webdriver crashes and the process stops without exit status
        }
      };

      // set meta data
      browser.testrunner.currentSuite = {
        set meta(value) {
          beforeAll(function(){
            browser.controlFlow().execute(function () {
              browser.testrunner.currentSuite._meta = value;
            });
          });
        },
        get meta() {
          return  {
            set controlName(value){
              browser.testrunner.currentSuite.meta = {controlName: value};
            }
          };
        }
      };
      browser.testrunner.currentSpec = {
        set meta(value) {
          browser.controlFlow().execute(function () {
            browser.testrunner.currentSpec._meta = value;
          });
        },
        get meta() {
          return  browser.testrunner.currentSpec._meta;
        }
      };

      var actionInterceptor = require('./reporter/actionInterceptor');
      var expectationInterceptor = require('./reporter/expectationInterceptor');
      // register reporters
      var jasmineEnv = jasmine.getEnv();
      moduleLoader.loadModule('reporters',[statisticCollector, actionInterceptor, expectationInterceptor]).forEach(function(reporter){
        reporter.register(jasmineEnv);
      });

      // add additional locators
      moduleLoader.loadModule('locators', [statisticCollector]).forEach(function (locator) {
        locator.register(by);
      });

    };

    protractorArgv.afterLaunch = function(){
      // teardown connection provider env
      logger.debug('Tearing down connection provider environment');
      return connectionProvider.teardownEnv();
    };

    // finds a UIVeri5 spec definition by a given Jasmine suite description
    // i.e. given the description of one of the suites in a spec file, find the information for that file.
    function _getSpecDetails(suite){
      return specs.filter(function (suiteDetails) {
        return suiteDetails.fullName === suite.description;
      })[0];
    }

    /**
     * Moving mouse to body (-1, -1)
     */
    function _moveMouseOutsideBody(driverActions) {
      logger.trace('Moving mouse to body (-1, -1).');
      // the implicit synchronization that element() does is important to ensure app is settled before clicking
      var bodyElement = element(by.css('body'));
      return driverActions.mouseMove(bodyElement, {x:-1, y:-1}).perform();
    }

    // register page object factory on global scope
    logger.debug('Loading BDD-style page object factory');
    pageObjectFactory.register(global);

    // setup connection provider env
    logger.debug('Setting up connection provider environment');
    return connectionProvider.setupEnv().then(function(){
      // call protractor
      logger.info('Executing ' + specs.length + ' specs');
      var protractorLauncher = require('protractor/built/launcher');
      protractorLauncher.init(null,protractorArgv);
    });
  });
}

exports.run = run;
