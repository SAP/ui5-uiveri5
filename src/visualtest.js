
var _ = require('lodash');
var proxyquire =  require('proxyquire');

var DEFAULT_CLIENTSIDESCRIPTS = './clientsidescripts';
var DEFAULT_CONNECTION_NAME = 'direct';

/**
 * @typedef Config
 * @type {Object}
 * @property {String} specResolver - spec resolver to use, defaults to: localSpecResolver for profile integration
 *  and localUI5SpecResolver for profile visual
 * @property {String} conf - config file to use, defaults to: '../conf/default.conf.js'
 *  that contains only: profile: 'visual'
 * @property {String} profile - used to resolve profile config file with pattern: '../conf/<profile>.conf.js,
 *  no profile resolved if undefined, defaults to: visual if default.conf.js loaded
 * @property {number} verbose - verbose level, 0 shows only info, 1 shows debug,
 *  2 shows waitForUI5 executions,3 shows also waitForUI5 script content, defaults t: 0
 * @property {String} seleniumAddress - Address of remote Selenium server, if missing will start local selenium server
 * TODO seleniumHost
 * TODO seleniumPort
 * TODO selenumLoopback
 * TODO seleniumArgs
 * @property {<BrowserCapability|String}>[]} browsers - list of browsers to drive. single word is assumed to
 *  be browserName else is parsed as json, defaults to: 'chrome'
 * @property {Object} params - params object to be passed to the tests
 * @property {boolean} ignoreSync - disables waitForUI5 synchronization, defaults to: false
 * @property {String} clientsidescripts - client side scripts file, defaults to: ./clientsidescripts
 * TODO params
 */

/**
 * Runs visual tests
 * @param {Config} config - configs
 */
function run(config) {

  // configure logger
  var logger = require('./logger')(config.verbose);

  // log config object so far
  logger.debug('Config from command-line: ${JSON.stringify(config)}',{config:config});

  // merge in config files
  var configParser = require('./configParser')(logger);
  config = configParser.mergeConfigs(config);

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
  var specs = specResolver.resolve();
  if (!specs || specs.length==0){
    throw Error("No specs found");
  }

  // set default clientsidescripts module
  config.clientsidescripts = config.clientsidescripts || DEFAULT_CLIENTSIDESCRIPTS;

  // resolve connection
  var connectionName = config.connection || DEFAULT_CONNECTION_NAME;
  var connectionConfig = config.connectionConfigs[connectionName];
  if (!connectionConfig){
    throw Error('Could not find connection: ' + connectionName);
  }

  // create connectionProvider
  var connectionProvider = moduleLoader.loadNamedModule('connection');

  // prepare protractor executor args
  var protractorArgv = {};

  // enable protractor debug logs
  protractorArgv.troubleshoot = config.verbose>0;

  // add baseUrl
  protractorArgv.baseUrl = config.baseUrl;

  // add selenium server address
  protractorArgv.seleniumAddress = config.seleniumAddress;

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

  // set specs
  protractorArgv.specs = [];
  specs.forEach(function(spec){
    protractorArgv.specs.push(spec.testPath);
  });

  // resolve runtime and set browsers with capabilities
  var runtimeResolver = require('./runtimeResolver')(config,logger,connectionProvider);
  var runtimes = runtimeResolver.resolveRuntimes();
  protractorArgv.multiCapabilities = runtimeResolver.resolveMultiCapabilitiesFromRuntimes(runtimes);

  // execute runtimes consequently
  // TODO consider concurrent execution
  protractorArgv.maxSessions = 1;

  // execute before any setup
  protractorArgv.beforeLaunch =  function() {

    // override angular-specific scripts
    var clientsidesriptsName = config.clientsidescripts;
    logger.debug('Loading client side scripts module: ' + clientsidesriptsName);
    var clientsidescripts = require(clientsidesriptsName);
    //var protractor = proxyquire('../node_modules/protractor/lib/protractor.js',
    var protractor = proxyquire('protractor/lib/protractor',
      {'./clientsidescripts.js': clientsidescripts});

    // setup connection provider env
    logger.debug('Setting up connection provider environment');
    return connectionProvider.setupEnv();
  };

  // execute after complete setup and just before test execution starts
  protractorArgv.onPrepare = function() {

    // publish visualtest configs on protractor's browser object
    browser.testrunner = {};
    browser.testrunner.config = config;

    var matchers = {};
    var storageProvider;
    // register a hook to be called once webdriver connection is established
    browser.getProcessedConfig().then(function(protractorConfig) {
      var currentCapabilities = protractorConfig.capabilities;
      var currentRuntime = runtimeResolver.resolveRuntimeFromCapabilities(currentCapabilities);

      // register screenshot provider
      var screenshotProvider = moduleLoader.loadModuleIfAvailable('screenshotProvider');
      if(screenshotProvider){
        screenshotProvider.register();
      }

      // load storage provider
      storageProvider = moduleLoader.loadModuleIfAvailable('storageProvider',[currentRuntime]);

      // export current runtime for tests
      browser.testrunner.runtime = currentRuntime;

      // load comparison provider and register the custom matcher
      var comparisonProvider = moduleLoader.loadModuleIfAvailable('comparisonProvider',[storageProvider]);
      if(comparisonProvider){
        comparisonProvider.register(matchers);
      }

      // process remoteWebDriverOptions
      if (currentCapabilities.remoteWebDriverOptions){
        var options = currentCapabilities.remoteWebDriverOptions;
        if (options.maximized){
          logger.debug('Maximizing browser window');
          browser.driver.manage().window().maximize();
        }
        if (options.size){
          if (!options.size.width || !options.size.height){
            throw Error('Setting browser window size required but no width and/or height specified');
          }
          var width = options.size.width;
          if(_.isString(width)){
            width = parseInt(width,10);
          }
          var height = options.size.height;
          if(_.isString(height)){
            width = parseInt(height,10);
          }
          logger.debug('Setting browser width: ' + width + ' ,height: ' + height);
          browser.driver.manage().window().setSize(width,height);
        }
        if (options.position){
          if (!options.position.x || !options.position.y){
            throw Error('Setting browser window position required but no X and/or Y coordinates specified');
          }
          var x = options.position.x;
          if(_.isString(x)){
            width = parseInt(x,10);
          }
          var y = options.position.y;
          if(_.isString(y)){
            width = parseInt(y,10);
          }
          logger.debug('Setting browser position: ' + x + ' ,y: ' + y);
          browser.driver.manage().window().setPosition(x,y);
        }
      }
    });

    // log script executions
    var origExecuteAsyncScript_= browser.executeAsyncScript_;
    browser.executeAsyncScript_ = function() {

      // log the call
      logger.trace('Executing async script: ' + arguments[1] +
        (logger.level > 2 ? ('\n' + arguments[0] + '\n') : ''));

      //call original fn in its context
      return origExecuteAsyncScript_.apply(browser, arguments);
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
        try {
          var specFullName = result.description;
          var spec = _getSpecByFullName(specFullName);

          // disable waitForUI5() if explicitly requested
          if(config.ignoreSync) {
            logger.debug('Disabling client synchronization');
            browser.ignoreSynchronization = true;
          }

          // open content page if required
          if (spec.contentUrl) {
            logger.debug('Opening: ' + spec.contentUrl);

            // below driver.xxx operations are inherently synchronized by webdriver flow

            // bypass browser.get() as it does angular-magic that we do not need to override
            browser.driver.get(spec.contentUrl).then(function () {
              // call storage provider beforeEach hook
              if (storageProvider && storageProvider.onBeforeEachSpec) {
                storageProvider.onBeforeEachSpec(spec);
              }
            });
            // TODO check http status, throw error if error

            // handle fiori-form
            var auth = config.auth;
            if (auth && auth.type === 'fiori-form') {
              if (!auth.user || !auth.pass) {
                throw Error('Fiori-form auth requested but user or pass is not specified');
              }

              browser.driver.findElement(by.id('USERNAME_FIELD-inner')).sendKeys(auth.user);
              browser.driver.findElement(by.id('PASSWORD_FIELD-inner')).sendKeys(auth.pass);
              browser.driver.findElement(by.id('LOGIN_LINK')).click();
            }

            // handle pageLoading options
            if(config.pageLoading){

              // reload the page immediately if required
              if(config.pageLoading.initialReload){
                logger.debug('Initial page reload requested');
                browser.driver.navigate().refresh();
              }

              // wait some time after page is loaded
              if(config.pageLoading.wait){
                var wait = config.pageLoading.wait;
                if(_.isString(wait)) {
                  wait = parseInt(wait,10);
                }

                logger.debug('Initial page load wait: ' + wait + 'ms');
                browser.sleep(wait);
              }
            }
          }

          // as failed expectation
          //expect(true).toBe(false);

          // no effect
          //throw new Error('test error');

          // as failed expectation
          //fail(new Error('test error'));

          //no effect
          //disable();

          //no effect
          //pend();

        }catch(error){
          // TODO display only once -> https://github.com/jasmine/jasmine/issues/778
          fail(error);
        }
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

    // gather statistic
    var statisticCollector = require('./statisticCollector')();
    jasmine.getEnv().addReporter({
      jasmineStarted: function(){
        statisticCollector.jasmineStarted()
      },
      suiteStarted: function(jasmineSuite){
        statisticCollector.suiteStarted(jasmineSuite);
      },
      specStarted: function(jasmineSpec){
        statisticCollector.specStarted(jasmineSpec);
      },
      specDone: function(jasmineSpec){
        statisticCollector.specDone(jasmineSpec);
      },
      suiteDone: function(jasmineSuite){
        statisticCollector.suiteDone(jasmineSuite);
      },
      jasmineDone: function(){
        statisticCollector.jasmineDone();
      }
    });

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
      throw new Error('Spec with full name: ' + specFullName + ' not found');
    }

    return specs[specIndex];
  }

  // call protractor
  logger.info('Executing ' + specs.length + ' specs');
  var protractorLauncher = require('protractor/lib/launcher');
  protractorLauncher.init(null,protractorArgv);
};

/**
 * Merge objects and arrays
 */
function _mergeConfig(object,src){
  return _.merge(object,src,function(objectValue,sourceValue){
    if (_.isArray(objectValue)) {
      return objectValue.concat(sourceValue);
    }
  });
};

exports.run = run;
