'use strict';

var _ = require('lodash');
var logger = require('./logger');
var proxyquire =  require('proxyquire');

var DEFAULT_CONF = '../conf/default.conf.js';
var DEFAULT_BASE_URL = 'http://localhost:8080';
var DEFAULT_SPEC_RESOLVER = './remoteSAPUI5SpecResolver';
var DEFAULT_CLIENTSIDESCRIPTS = './clientsidescripts';

var run = function(config) {

  // configure logger
  logger.enableDebug(config.verbose);

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
  logger.enableDebug(config.verbose);

  // set baseUrl
  config.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  logger.debug('Using baseUrl: ' + config.baseUrl);

  // resolve specs
  var specResolverName = config.specResolver || DEFAULT_SPEC_RESOLVER;
  logger.debug('Loading spec resolver module: ' + specResolverName);
  var specResolver = require(specResolverName)(config);
  var specs = specResolver.resolve();
  if (specs.length==0){
    throw new Error("No specs found");
  }

  // set default clientsidescripts module
  config.clientsidescripts = config.clientsidescripts || DEFAULT_CLIENTSIDESCRIPTS;

  // prepare protractor executor args
  var protractorArgv = {};

  // enable debug logs
  protractorArgv.troubleshoot = config.verbose;

  // add baseUrl
  protractorArgv.baseUrl = config.baseUrl;

  // use jasmine 2.0
  protractorArgv.framework = 'jasmine2';

  // add specs as protractor expects
  protractorArgv.specs = [];
  specs.forEach(function(spec){
      protractorArgv.specs.push(spec.path);
  });

  // execute before any setup
  protractorArgv.beforeLaunch =  function() {

    var clientsidesriptsName = config.clientsidescripts;
    logger.debug('Loading client side scripts module: ' + clientsidesriptsName);
    var clientsidescripts = require(clientsidesriptsName);
    var protractor = proxyquire('../node_modules/protractor/lib/protractor.js',
      {'./clientsidescripts.js': clientsidescripts});
  }

  // execute after complete setup and just before test execution starts
  protractorArgv.onPrepare = function() {

    // publish visualtest configs on protractor's browser object
    browser.visualtest = {};
    browser.visualtest.config = config;

    // open test content page
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
  var protractorLauncher = require('protractor/lib/launcher');
  protractorLauncher.init(null,protractorArgv);
};

exports.run = run;
