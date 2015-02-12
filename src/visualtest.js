'use strict';

var logger = require("./logger");
var specResolver = require("./specResolver");

var run = function(config) {

  // set defaults
  config.verbose = config.verbose || false;
  config.baseUrl = config.baseUrl || 'http://localhost:8080';

  logger.enableDebug(config.verbose);

  // resolve the specs
  var specs = specResolver.discover(config.libsFilter,config.specsFilter);

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
          var specFullName = result.description;
          var spec = _getSpecByFullName(specFullName);
          logger.debug('Starting spec with full name: ' + specFullName);

          logger.debug('Opening: ' + config.baseUrl + '/' + spec.contentUri);
          browser.ignoreSynchronization = true;
          browser.get(spec.contentUri);
          // TODO check http status, throw error if necessary

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

  function _getSpecByFullName(specFullName){
    var specIndex = specs.map(function(spec){return spec.lib + '.' + spec.name;}).indexOf(specFullName);
    if(specIndex==-1){
      throw new Error('Spec with full name: ' + specFullName + 'not found');
    }

    return specs[specIndex];
  }

  // call protractor
  var protractorLauncher = require('protractor/lib/launcher');
  protractorLauncher.init(null,protractorArgv);
};

exports.run = run;
