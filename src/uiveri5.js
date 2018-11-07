
var _ = require('lodash');
var proxyquire =  require('proxyquire');
var url = require('url');
var clientsidescripts = require('./scripts/clientsidescripts');
var ClassicalWaitForUI5 = require('./scripts/classicalWaitForUI5');
var Control = require('./control');
var pageObjectFactory = require('./pageObjectFactory');

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

  // configure logger
  var logger = require('./logger')(config.verbose);

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

  // start module loader
  var moduleLoader = require('./moduleLoader')(config,logger);

  // load spec resolver
  var specResolver = moduleLoader.loadModule('specResolver');

  // resolve specs
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
    var connectionProvider = moduleLoader.loadNamedModule('connection');

    // prepare protractor executor args
    var protractorArgv = connectionProvider.buildProtractorArgv();

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

    proxyquire('protractor/built/browser', {
      './clientsidescripts': clientsidescripts
    });
    proxyquire('protractor/built/element', {
      './clientsidescripts': clientsidescripts
    });
    proxyquire('protractor/built/locators', {
      './clientsidescripts': clientsidescripts
    });

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
    logger.debug('Resolved protractor multiCapabilities from runtime: ' + JSON.stringify(protractorArgv.multiCapabilities));

    // no way to implement concurrent executions with current driverProvider impl
    protractorArgv.maxSessions = 1;

    // export protractor module object as global.protractorModule
    protractorArgv.beforeLaunch = __dirname + '/beforeLaunchHandler';

    // execute after test env setup and just before test execution starts
    protractorArgv.onPrepare = function () {

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

      // override with added logging and parameter manipulation
      var origExecuteAsyncScript_= browser.executeAsyncScript_;
      browser.executeAsyncScript_ = function() {
        // log script execution
        logger.trace('Execute async script: ${name}, code:\n ${JSON.stringify(code)}',
          {name:  arguments[1], code: arguments[0]});
        // override the timeout used by waitForAngular
        arguments[2] = JSON.stringify({
          waitForUI5Timeout: waitForUI5Timeout
        });
        //call original function in its context
        return origExecuteAsyncScript_.apply(browser, arguments);
      };

      browser.loadUI5Dependencies = function () {
        return browser.executeAsyncScript(clientsidescripts.loadUI5Dependencies, {
          waitForUI5Timeout: waitForUI5Timeout,
          waitForUI5PollingInterval: config.timeouts.waitForUI5PollingInterval,
          ClassicalWaitForUI5: ClassicalWaitForUI5,
          useClassicalWaitForUI5: config.useClassicalWaitForUI5
        }).then(function (res) {
          logger.debug('loadUI5Dependencies: ' + res.log);
          if (res.error) {
            throw new Error('loadUI5Dependencies: ' + res.error);
          }
        });
      };

      browser.setViewportSize = function (viewportSize) {
        return browser.executeScriptWithDescription(clientsidescripts.getWindowToolbarSize, 'browser.setViewportSize').then(function (toolbarSize) {
          browser.driver.manage().window().setSize(viewportSize.width * 1 + toolbarSize.width, viewportSize.height * 1 + toolbarSize.height); // convert to integer implicitly
        });
      };

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
            var spec = _getSpecByFullName(specFullName);
            if (!spec) {
              fail(new Error('Spec with full name: ' + specFullName + ' not found'));
              return;
            }

            // disable waitForUI5() if explicitly requested
            if (config.ignoreSync) {
              logger.debug('Disabling client synchronization');
              browser.waitForAngularEnabled(false);
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
            browser.testrunner.navigation.to(specUrlString,'auth').then(function () {
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
          var spec = _getSpecByFullName(specFullName);

          // call storage provider afterEach hook
          if (storageProvider && storageProvider.onAfterEachSpec){
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

      // setup plugin hooks
      jasmine.getEnv().addReporter({
        suiteStarted: function(jasmineSuite){
          _callPlugins('suiteStarted',[{name:jasmineSuite.description}]);
        },
        specStarted: function(jasmineSpec){
          _callPlugins('specStarted',[{name:jasmineSpec.description}]);
        },
        specDone: function(jasmineSpec){
          _callPlugins('specDone',[{name:jasmineSpec.description}]);
        },
        suiteDone: function(jasmineSuite){
          _callPlugins('suiteDone',[{name:jasmineSuite.description}]);
        },
      });
  
      // expose navigation helpers to tests
      browser.testrunner.navigation = {
        to: function(url,auth) {
          var authenticator =  moduleLoader.loadNamedModule(auth, [statisticCollector]);

          // open page and login
          browser.controlFlow().execute(function () {
            logger.info('Opening: ' + url);
          });
          authenticator.get(url);

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

          // load waitForUI5 logic on client
          browser.loadUI5Dependencies();

          // ensure app is fully loaded before starting the interactions
          browser.waitForAngular();
          
          // log UI5 version
          return browser.executeScriptWithDescription(clientsidescripts.getUI5Version, 'browser.getUI5Version').then(function (versionInfo) {
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

    function _getSpecByFullName(specFullName){
      var specIndex = specs.map(function(spec){return spec.fullName;}).indexOf(specFullName);
      if(specIndex==-1){
        return;
      }

      return specs[specIndex];
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

    function _callPlugins(method,args) {
      return Promise.all(
        plugins.map(function(module) {
          if (module[method]) {
            return module[method].apply(module,args);
          }
        })
      );
    }
    // register page object factory on global scope
    logger.debug('Loading BDD-style page object factory');
    pageObjectFactory.register(global);

    // load plugins
    var plugins = moduleLoader.loadModule('plugins');
    protractorArgv.plugins = [{
      inline: {
        setup: function() {
          _callPlugins('setup');
        },
        onPrepare: function() {
          _callPlugins('onPrepare');
        },
        teardown: function() {
          _callPlugins('teardown');
        }
      }
    }];
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
