'use strict';

var path = require('path');
var glob = require('glob');

var BASE_URL = 'http://localhost:8080';
var SUITES_GLOB = 'src/**/test/**/visual/visual.suite.js';
var CONTENT_ROOT_URI = 'testsuite/test-resources/';

/**
 * @typedef LocalUI5SpecResolverConfig
 * @type {Object}
 * @extends {Config}
 * @property {String} baseUrl - base url to reference, falsy disables page loading, defaults to: 'http://localhost:8080'
 * @property {string} libFilter - comma separated list of libraries, '*' means all, defaults to: '*'
 * @property {string} specFilter - comma separated list of spec names, '*' means all, defaults to '*'
 * @property {string} LocalUI5SpecResolverConfig.suitesGlob - suites glob, default to: 'src/<any>/test/<any>/visual/visual.suite.js'
 * @property {string} LocalUI5SpecResolverConfig.contentRootUri - content uri, defaults to: 'testsuite/test-resources/'
 */

/**
 * Resolves specs from local UI5 project
 * @constructor
 * @implements {SpecResolver}
 * @param {LocalUI5SpecResolverConfig} config - configs
 */
function LocalUI5SpecResolver(config, logger){
  this.config  = config;
  this.logger = logger;

  this.baseUrl = this.config.baseUrl || BASE_URL;
  this.libFilter = this.config.libFilter || '*';
  this.specFilter = this.config.specFilter || '*';
  this.suitesGlob =
    (this.config.localUI5SpecResolver ? this.config.localUI5SpecResolver.suitesGlob : false) || SUITES_GLOB;
  this.contentRootUri =
    (this.config.localUI5SpecResolver ? this.config.localUI5SpecResolver.contentRootUri : false) || CONTENT_ROOT_URI;

}

LocalUI5SpecResolver.prototype.resolve = function(){
  var that = this;

  // c:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
  //http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html

  /** @type {Spec[]} */
  var specs = [];

  //log
  that.logger.debug('Resolving specs from suites glob: ' + that.suitesGlob + " contentRootUri: " + that.contentRootUri);

  // resolve suite glob to array of paths
  var suitePathMask = path.normalize(process.cwd() + '/' + that.suitesGlob);
  var suitePaths = glob.sync(suitePathMask);
  suitePaths.forEach(function(suitePath){

    // extract lib from
    var suitePathMatch = suitePath.match(/((?:\w\:)?\/(?:[\w\-]+\/)+([\w\.]+)\/(?:\w+\/)+)visual\.suite\.js/);
    if (suitePathMatch===null){
      throw new Error('Could not parse suite path: ' + suitePath);
    }
    var suiteBasePath = suitePathMatch[1].slice(0,-1);  // remove trailing '/' for consistency
    var libName = suitePathMatch[2];

    // filter out this lib if necessary
    if(that.libFilter!=='*' && that.libFilter.toLowerCase().indexOf(libName.toLowerCase())==-1){
      that.logger.debug('Drop lib: ' + libName + ' that does not match lib filter: ' + that.libFilter);
      return;
    }

    // resolve spec names from this suite
    var specFileNames = [];
    var suite = require(suitePath);
    if (suite instanceof Array) {
      specFileNames = specFileNames.concat(suite);
    } else if (suite instanceof Function) {
      suite({specs: specFileNames});
    }

    // prepare a spec for each name from suite
    specFileNames.forEach(function(specFileName){

      // extract spec name from file name
      var specFileNameMatch = specFileName.match(/(\w+)\.spec\.js/);
      if( specFileNameMatch===null){
        throw Error('Could not parse spec file name: ' + specFileName);
      }
      var specName = specFileNameMatch[1];

      // apply spec filter
      if(that.specFilter!=='*' && that.specFilter.toLowerCase().indexOf(specName.toLowerCase())==-1){
        that.logger.debug('Drop spec: ' + specName + ' that does not match spec filter: ' + that.specFilter);
        return;
      }

      var spec = {
        name: specName,
        fullName: libName + '.' + specName,
        testBasePath: suiteBasePath,
        testPath: suiteBasePath + '/' + specFileName,
        contentUrl: that.baseUrl ?
          (that.baseUrl + '/' + that.contentRootUri + libName.replace(/\./,'/') + '/' + specName + '.html') :
          false
      };

      that.logger.debug('Spec found: ' + JSON.stringify(spec));
      specs.push(spec);
    });
  });

  // return the specs
  return specs;
};

module.exports = function(config, logger){
  return new LocalUI5SpecResolver(config, logger);
};
