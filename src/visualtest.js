'use strict';

var _ = require('lodash');
var logger = require('./logger');
var proxyquire =  require('proxyquire');

var DEFAULT_CONF = '../conf/default.conf.js';
//var DEFAULT_BASE_URL = 'http://localhost:8080';
var DEFAULT_SPEC_RESOLVER = './remoteSAPUI5SpecResolver';
var DEFAULT_CLIENTSIDESCRIPTS = './clientsidescripts';

/**
 * @typedef Config
 * @type {Object}
 * @property {String} specResolver - spec resolver to use, defaults to: './remoteSAPUI5SpecResolver'
 * @property {String} conf - config file to use, defaults to: '../conf/default.conf.js' that contains only: profile: 'visual'
 * @property {String} profile - used to resolve profile config file with pattern: '../conf/<profile>.conf.js, no profile resolved if undefined, defaults to: visual if default.conf.js loaded
 * @property {number} verbose - verbose level, 0 shows only info, 1 shows debug, 2 shows waitForUI5 executions, 3 shows also waitForUI5 script content, defaults t: 0
 * @property {String} seleniumAddress - Address of remote Selenium server, if missing will start local selenium server
 * TODO seleniumHost
 * TODO seleniumPort
 * TODO selenumLoopback
 * TODO seleniumArgs
* @property {<BrowserCapability|String}>[]} browsers - list of browsers to drive. single word is assumed to be browserName, defaults to: 'chrome'
 * @property {Object} params - params object to be passed to the tests
 * TODO browser.maximised defaults to: true
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
  logger.setLevel(config.verbose);

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
  }

  // update logger with resolved configs
  logger.setLevel(config.verbose);

  // set baseUrl
  // TODO went to individual spec resolvers
  //config.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  //logger.debug('Using baseUrl: ' + config.baseUrl);

  // log cwd
  logger.info('Current working directory: ' + process.cwd());

  // resolve specs
  var specResolverName = config.specResolver || DEFAULT_SPEC_RESOLVER;
  logger.debug('Loading spec resolver module: ' + specResolverName);
  logger.info('Resolving specs');
  var specResolver = require(specResolverName)(config);
  var specs = specResolver.resolve();
  if (!specs || specs.length==0){
    throw new Error("No specs found");
  }
  logger.info( specs.length + ' spec file found');

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
    protractorArgv.specs.push(spec.path);
  });

  // set browsers with capabilities
  if (config.browsers){
    logger.debug('Browsers with capabilities: ' + JSON.stringify(config.browsers));
    protractorArgv.multiCapabilities = config.browsers;
  }

  // execute before any setup
  protractorArgv.beforeLaunch =  function() {

    // override angular-specific scripts
    var clientsidesriptsName = config.clientsidescripts;
    logger.debug('Loading client side scripts module: ' + clientsidesriptsName);
    var clientsidescripts = require(clientsidesriptsName);
    var protractor = proxyquire('../node_modules/protractor/lib/protractor.js',
      {'./clientsidescripts.js': clientsidescripts});
  }

  // execute after complete setup and just before test execution starts
  protractorArgv.onPrepare = function() {

    // publish visualtest configs on protractor's browser object
    browser.testrunner = {};
    browser.testrunner.config = config;

    // TODO resolve and publish whole runtime
    browser.testrunner.runtime = {};
    browser.testrunner.runtime.browserName = 'chrome';

    // log script executions
    var origExecuteAsyncScript_= browser.executeAsyncScript_;
    browser.executeAsyncScript_ = function() {

      // log the call
      logger.trace('Executing async script: ' + arguments[1] +
        (config.verbose > 2 ? ('\n' + arguments[0] + '\n') : ''));

      //call original fn in its context
      return origExecuteAsyncScript_.apply(browser, arguments);
    }

    // hook into specs lifecycle
    // open test content page before every suite
    jasmine.getEnv().addReporter({
      //TODO consider several describe() per spec file
      suiteStarted: function(result){
        try {
          var specName = result.description;
          var spec = _getSpecByName(specName);
          logger.debug('Starting spec with name: ' + specName);

          // disable waitForUI5() if explicitly requested
          if(config.ignoreSync) {
            logger.debug('Disabling client synchronization');
            browser.ignoreSynchronization = true;
          }

          // open content page if required
          if (spec.contentUrl) {
            logger.debug('Opening: ' + spec.contentUrl);

            // bypass browser.get() as it does angular-magic that we do not need to overwride
            browser.driver.get(spec.contentUrl);
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
      }
    });
  };

  // If you need access back to the current configuration object,
// use a pattern like the following:
// browser.getProcessedConfig().then(function(config) {
// // config.capabilities is the CURRENT capability being run, if
// // you are using multiCapabilities.
// console.log('Executing capability', config.capabilities);
// });

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

  function _getSpecByName(specName){
    var specIndex = specs.map(function(spec){return spec.name;}).indexOf(specName);
    if(specIndex==-1){
      throw new Error('Spec with name: ' + specName + ' not found');
    }

    return specs[specIndex];
  }

  // call protractor
  logger.info('Executing specs');
  var protractorLauncher = require('protractor/lib/launcher');
  protractorLauncher.init(null,protractorArgv);
};

exports.run = run;
