/**
 * uses modules copied from protractor@5.3.2
 */

var fs = require('fs');
var _ = require('lodash');
var url = require('url');
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
 */

/**
 * Runs visual tests
 * @param {Config} config - configs
 * @return {Promise} resolved on success or rejected with error 
 */
function run(config) {

  logger.setLevel(config.verbose);

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

  var moduleLoader = require('./moduleLoader')(config);
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

    // prepare executor args
    var launcherArgv = connectionProvider.buildLauncherArgv();

    // enable debug logs
    launcherArgv.troubleshoot = config.verbose > 0;

    // add baseUrl
    launcherArgv.baseUrl = config.baseUrl;

    // use jasmine 2.0
    launcherArgv.framework = 'jasmine2';
    launcherArgv.jasmineNodeOpts = {};

    // disable default jasmine console reporter
    launcherArgv.jasmineNodeOpts.print = function() {};

    // copy timeouts
    if (config.timeouts){
      if (config.timeouts.getPageTimeout){
        var getPageTimeout = config.timeouts.getPageTimeout;
        if(_.isString(getPageTimeout)){
          getPageTimeout = parseInt(getPageTimeout,10);
        }
        logger.debug('Setting getPageTimeout: ' + getPageTimeout);
        launcherArgv.getPageTimeout = getPageTimeout;
      }
      if (config.timeouts.allScriptsTimeout){
        var allScriptsTimeout = config.timeouts.allScriptsTimeout;
        if(_.isString(allScriptsTimeout)){
          allScriptsTimeout = parseInt(allScriptsTimeout,10);
        }
        logger.debug('Setting allScriptsTimeout: ' + allScriptsTimeout);
        launcherArgv.allScriptsTimeout = allScriptsTimeout;
      }
      if (config.timeouts.defaultTimeoutInterval){
        var defaultTimeoutInterval = config.timeouts.defaultTimeoutInterval;
        if(_.isString(defaultTimeoutInterval)){
          defaultTimeoutInterval = parseInt(defaultTimeoutInterval,10);
        }
        logger.debug('Setting defaultTimeoutInterval: ' + defaultTimeoutInterval);
        launcherArgv.jasmineNodeOpts.defaultTimeoutInterval = defaultTimeoutInterval;
      }
    }

    // set specs
    launcherArgv.specs = [];
    specs.forEach(function(spec){
      launcherArgv.specs.push(spec.testPath);
    });

    // resolve browsers capabilities from runtime
    launcherArgv.multiCapabilities = config.runtimes.map(function(runtime){
      // prepare capabilities from runtime for this specific connection type
      return connectionProvider.resolveCapabilitiesFromRuntime(runtime);
    });
    logger.debug('Resolved multiCapabilities: ' + JSON.stringify(launcherArgv.multiCapabilities));

    // TODO see driverProvider
    // no way to implement concurrent executions with current driverProvider impl
    // launcherArgv.maxSessions = 1;

    // execute after test env setup and just before test execution starts
    launcherArgv.onPrepare = function () {
      plugins.loadJasminePlugins();

      browser.setConfig(config);

      var matchers = {};
      var storageProvider;

      // register a hook to be called after webdriver is created ( may not be connected yet )
      browser.getProcessedConfig().then(function (processedConfig) {
        var runtime = connectionProvider.resolveRuntimeFromCapabilities(processedConfig.capabilities);
        logger.debug('Runtime resolved from capabilities: ' + JSON.stringify(runtime));

        browser.setRuntime(runtime);

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

        browser.setInitialWindowSize();
      });

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
      browser.testrunner.navigation._getAuthenticator = function (authConfig) {
        var authenticator;
        if (authConfig) {
          // programatically invoked authentication - load auth module every time
          authenticator = moduleLoader.loadNamedModule(authConfig, [statisticCollector]);
        } else {
          // auth is declared in config - load the (global) auth module only once.
          // when authOnce is enabled, auth should be done only once - before the first spec file.
          if (authConfigModule) {
            authenticator = config.authOnce ? null : authConfigModule;
          } else {
            authenticator = authConfigModule = moduleLoader.loadNamedModule(AUTH_CONFIG_NAME, [statisticCollector]);
          }
        }
        return authenticator;
      };

      var expectationInterceptor = require('./reporter/expectationInterceptor');
      // register reporters
      var jasmineEnv = jasmine.getEnv();
      moduleLoader.loadModule('reporters',[statisticCollector, expectationInterceptor]).forEach(function(reporter){
        reporter.register(jasmineEnv);
      });

      // add additional locators
      moduleLoader.loadModule('locators', [statisticCollector]).forEach(function (locator) {
        locator.register(by);
      });

    };

    launcherArgv.afterLaunch = function(){
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

    // register page object factory on global scope
    logger.debug('Loading BDD-style page object factory');
    pageObjectFactory.register(global);

    // setup connection provider env
    logger.debug('Setting up connection provider environment');
    return connectionProvider.setupEnv().then(function(){
      logger.info('Executing ' + specs.length + ' specs');

      var launcher = require('./ptor/launcher');
      launcher.init(launcherArgv, connectionProvider, plugins);
    });
  });
}

exports.run = run;
