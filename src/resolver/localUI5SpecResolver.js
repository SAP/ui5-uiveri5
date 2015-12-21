'use strict';

var path = require('path');
var glob = require('glob');

var BASE_URL = 'http://localhost:8080';
var DEFAULT_SUITES_GLOB = '**/test/**/visual/visual.suite.js';
var DEFAULT_SUITES_EXCLUDE = 'node_modules';
var DEFAULT_SUITES_REGEX = '((?:\\w\\:)?\\/(?:[\\w\\-.]+\\/)+([\\w\\.]+)\\/test\\/([\\w\\/]+)+visual\\/)visual\\.suite\\.js';
var CONTENT_ROOT_URI = 'testsuite/test-resources';

// c:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
// c:/Users/i076005/git/sap.gantt/gantt.lib/test/sap/gantt/visual’

/**
 * @typedef LocalUI5SpecResolverConfig
 * @type {Object}
 * @property {string} baseUrl - base url to reference, falsy disables page loading, defaults to: 'http://localhost:8080'
 * @property {string} libFilter - comma separated list of libraries, '*' means all, defaults to: '*'
 * @property {string} specFilter - comma separated list of spec names, '*' means all, defaults to '*'
  */

/**
 * @typedef LocalUI5SpecResolverInstanceConfig
 * @type {Object}
 * @property {string} suitesGlob - suites glob, default to all visual.suite.js files in test dirs
 * @property {string} suitesRegex - suites regex, default to all visual.suite.js files in test dirs
 * @property {string} contentRootUri - content uri, defaults to: 'testsuite/test-resources'
 */

/**
 * Resolves specs from local UI5 project
 * @constructor
 * @implements {SpecResolver}
 * @param {LocalUI5SpecResolverConfig} config
 * @param {LocalUI5SpecResolverInstanceConfig} instanceConfig
 * @param {Logger} logger
 */
function LocalUI5SpecResolver(config,instanceConfig,logger){
  //this.config  = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;

  this.baseUrl = config.baseUrl || BASE_URL;
  this.libFilter = config.libFilter || '*';
  this.specFilter = config.specFilter || '*';
  this.suitesGlob = instanceConfig.suitesGlob || DEFAULT_SUITES_GLOB;
  this.suitesExclude = instanceConfig.suitesExclude || DEFAULT_SUITES_EXCLUDE;
  this.suitesRegex = instanceConfig.suitesRegex || DEFAULT_SUITES_REGEX;
  this.contentRootUri = instanceConfig.contentRootUri || CONTENT_ROOT_URI;
  this.suiteRootPath = instanceConfig.suiteRootPath || process.cwd();
}

LocalUI5SpecResolver.prototype.resolve = function(){
  var that = this;

  // c:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
  // c:/Users/i076005\git\sap.gantt\gantt.lib\test\sap\gantt\visual’
  //http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html

  /** @type {Spec[]} */
  var specs = [];

  //log
  this.logger.debug('Resolving suites from: ' + this.suiteRootPath +
    ' using suites glob: ' + this.suitesGlob);

  // resolve suite glob to array of paths
  var suitePathMask = path.normalize(this.suiteRootPath + '/' + this.suitesGlob);
  var suitePaths = glob.sync(suitePathMask);
  this.logger.debug('Suites found: ' + suitePaths.length);

  // resolve specs from each suite
  suitePaths.forEach(function(suitePath){

    // couldn't make glob excludes to work so doing it manually
    // ignore if path contains exclude mask
    if (suitePath.indexOf(that.suitesExclude) !== -1){
      that.logger.debug('Suite path: ' + suitePath + ' matches exclude mask: ' + that.suitesExclude + ', ignoring');
      return;
    }

    // extract lib from
    var suitePathMatch = suitePath.match(that.suitesRegex);
    if (suitePathMatch===null){
      throw new Error('Could not parse suite path: ' + suitePath);
    }
    var suiteBasePath = suitePathMatch[1] .slice(0,-1);  // remove trailing '/' for consistency
    var libName = suitePathMatch[2];
    var suiteNamespace = suitePathMatch[3].slice(0,-1);  // remove trailing '/' for consistency

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

    that.logger.debug('Specs for lib: ' + libName + ' found: ' + specFileNames.length);

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
        fullName: suiteNamespace.replace(/\//,'.') + '.' + specName,
        testPath: suiteBasePath + '/' + specFileName,
        contentUrl: that.baseUrl ?
          (that.baseUrl + '/' + that.contentRootUri + '/' + suiteNamespace + '/' + specName + '.html') :
          false
      };

      that.logger.debug('Spec found: ' + JSON.stringify(spec));
      specs.push(spec);
    });
  });

  // return the specs
  return specs;
};

module.exports = function(config,instanceConfig,logger){
  return new LocalUI5SpecResolver(config,instanceConfig,logger);
};
