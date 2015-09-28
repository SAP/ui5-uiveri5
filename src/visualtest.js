'use strict';

var _ = require('lodash');
var proxyquire =  require('proxyquire');

var DEFAULT_CONF = '../conf/default.conf.js';
var DEFAULT_CLIENTSIDESCRIPTS = './clientsidescripts';

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
var run = function(config) {

  // configure logger
  var logger = require('./logger')(config.verbose);

  // load config file
  var configFileName = config.conf || DEFAULT_CONF;
  logger.debug('Loading config from: ' + configFileName);
  var configFile = require(configFileName).config;
  config = _.merge(configFile,config);
  logger.debug('Loaded config from: ' + configFileName);

  // resolve profile
  if (config.profile){
    var profileConfigFileName = '../conf/' + config.profile + '.profile.conf.js';
    logger.debug('Loading profile config from: ' + profileConfigFileName);
    var profileConfigFile = require(profileConfigFileName).config;
    config = _.merge(profileConfigFile,config);

    // apply common profile
    profileConfigFileName = '../conf/profile.conf.js';
    logger.debug('Loading common profile config from: ' + profileConfigFileName);
    var profileConfigFile = require(profileConfigFileName).config;
    config = _.merge(profileConfigFile,config);
  }

  // update logger with resolved configs
  logger.setLevel(config.verbose);

  // log cwd
  logger.info('Current working directory: ' + process.cwd());

  // resolve specs
  var specResolverName = config.specResolver;
  if(!specResolverName){
    throw Error("Spec resolver is not defined, unable to continue")
  }
  logger.debug('Loading spec resolver module: ' + specResolverName);
  logger.info('Resolving specs');
  var specResolver = require(specResolverName)(config,logger);
  var specs = specResolver.resolve();
  if (!specs || specs.length==0){
    throw new Error("No specs found");
  }
  logger.info( specs.length + ' spec file(s) found');

  // set default clientsidescripts module
  config.clientsidescripts = config.clientsidescripts || DEFAULT_CLIENTSIDESCRIPTS;

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

  // set specs
  protractorArgv.specs = [];
  specs.forEach(function(spec){
    protractorArgv.specs.push(spec.testPath);
  });

  // resolve runtime and set browsers with capabilities
  var runtimeResolver = require('./runtimeResolver')(config,logger);
  var runtimes = runtimeResolver.resolveRuntimes();
  protractorArgv.multiCapabilities = runtimeResolver.prepareMultiCapabilitiesFromRuntimes(runtimes);

  // execute runtimes consequently
  // TODO consider concurrent execution
  protractorArgv.maxSessions = 1;

  // register screenshot provider
  if(config.screenshotProvider){
    var screenshotProvider = require(config.screenshotProvider)(config,logger);
    screenshotProvider.register();
  }

  // execute before any setup
  protractorArgv.beforeLaunch =  function() {

    // override angular-specific scripts
    var clientsidesriptsName = config.clientsidescripts;
    logger.debug('Loading client side scripts module: ' + clientsidesriptsName);
    var clientsidescripts = require(clientsidesriptsName);
    var protractor = proxyquire('../node_modules/protractor/lib/protractor.js',
      {'./clientsidescripts.js': clientsidescripts});
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
      var currentRuntime = runtimeResolver.enrichRuntimeFromCapabilities(protractorConfig.capabilities);

      // register storage provider
      if(config.storageProvider){
        storageProvider = require(config.storageProvider)(config,logger,currentRuntime);
      }

      // export current runtime for tests
      browser.testrunner.runtime = currentRuntime;

      // register comparison provider
      if(config.comparisonProvider){
        var comparisonProvider = require(config.comparisonProvider)(config,logger,storageProvider);
        comparisonProvider.register(matchers);
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
          logger.debug('Starting spec with full name: ' + specFullName);

          // disable waitForUI5() if explicitly requested
          if(config.ignoreSync) {
            logger.debug('Disabling client synchronization');
            browser.ignoreSynchronization = true;
          }

          // open content page if required
          if (spec.contentUrl) {
            logger.debug('Opening: ' + spec.contentUrl);

            // bypass browser.get() as it does angular-magic that we do not need to overwride
            browser.driver.get(spec.contentUrl).then(function(){
              // call storage provider beforeEach hook
              if (storageProvider && storageProvider.onBeforeEachSpec){
                storageProvider.onBeforeEachSpec(spec);
              }
            });
            // TODO check http status, throw error if error
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
        logger.debug('Finished spec with full name: ' + specFullName);

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
  };

  /*
  // attach spec decorator
  protractorArgv.jasmineNodeOpts = {specDecorator : function(specName){

    var specIndex = specs.map(function(spec){return spec.name;}).indexOf(specName);
    if(specIndex==-1){
      throw new Error('Spec: '+specName+'not found');
    }

    return specs[specIndex].specPath;
  }};
  */

  function _getSpecByFullName(specFullName){
    var specIndex = specs.map(function(spec){return spec.fullName;}).indexOf(specFullName);
    if(specIndex==-1){
      throw new Error('Spec with full name: ' + specFullName + ' not found');
    }

    return specs[specIndex];
  }

  // call protractor
  logger.info('Executing specs');
  var protractorLauncher = require('protractor/lib/launcher');
  protractorLauncher.init(null,protractorArgv);
};

exports.run = run;
