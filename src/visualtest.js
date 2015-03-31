'use strict';

var _ = require('lodash');
var logger = require('./logger');

var DEFAULT_CONF = '../conf/default.conf.js';
var BASE_URL = 'http://localhost:8080';

var run = function(config) {

  // load config file
  var configFileName = config.conf || DEFAULT_CONF;
  var configFile = require(configFileName).config;
  config = _.merge(configFile,config);

  // resolve profile
  if (config.profile){
    var profileConfigFile = require('../conf/' + config.profile + '.profile.conf.js').config;
    config = _.merge(profileConfigFile,config);
  }

  // set defaults
  config.verbose = config.verbose || false;
  config.baseUrl = config.baseUrl || BASE_URL;

  // TODO is this the best place ?
  logger.enableDebug(config.verbose);

  // create the configured spec resolver
  var specResolver = require(config.specResolver)(config);

  // resolve the specs
  var specs = specResolver.resolve();

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

  // add spec file startup hook
  protractorArgv.onPrepare = function() {
    jasmine.getEnv().addReporter({
      //TODO consider several describe() per spec file
      suiteStarted: function(result){
        try {
          var specName = result.description;
          var spec = _getSpecByName(specName);
          logger.debug('Starting spec with name: ' + specName);

          // TODO remove when waitForUI5 is ready
          browser.ignoreSynchronization = true;

          // open content page if required
          if (spec.contentUrl) {
            logger.debug('Opening: ' + spec.contentUrl);
            browser.get(spec.contentUrl);
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
      throw new Error('Spec with name: ' + specName + 'not found');
    }

    return specs[specIndex];
  }

  // call protractor
  var protractorLauncher = require('protractor/lib/launcher');
  protractorLauncher.init(null,protractorArgv);
};

exports.run = run;
