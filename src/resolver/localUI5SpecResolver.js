'use strict';

var path = require('path');
var glob = require('glob');
var git = require('simple-git')();
var Q = require('q');

var BASE_URL = 'http://localhost:8080';
var DEFAULT_SUITES_GLOB = '**/test/**/visual/visual.suite.js';
var DEFAULT_SUITES_EXCLUDE = 'node_modules';
var DEFAULT_SUITES_REGEX = '((?:\\w\\:)?\\/(?:[\\w\\-.]+\\/)+(?:[\\w\\.]+)\\/test\\/([\\w\\/]+)+visual\\/)visual\\.suite\\.js';
var CONTENT_ROOT_URI = 'test-resources';

// c:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
// c:/Users/i076005/git/sap.gantt/gantt.lib/test/sap/gantt/visual’

/**
 * @typedef LocalUI5SpecResolverConfig
 * @type {Object}
 * @property {string} baseUrl - base url to reference, falsy disables page loading, defaults to: 'http://localhost:8080'
 * @property {string} libFilter - comma separated list of libraries, '*' means all, defaults to: '*'
 * @property {string} libExclude - comma separated list of libraries, '' means nothing to be excluded
 * @property {string} specFilter - comma separated list of spec names, '*' means all, defaults to '*'
 * @property {string} specExclude - comma separated list of spec names, '' means nothing to be excluded
 * @property {string} branch - branch, overwrites automatically derived by git
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
  this.libExclude = config.libExclude || '';
  this.specFilter = config.specFilter || '*';
  this.specExclude = config.specExclude || '';
  this.suitesGlob = instanceConfig.suitesGlob || DEFAULT_SUITES_GLOB;
  this.suitesExclude = instanceConfig.suitesExclude || DEFAULT_SUITES_EXCLUDE;
  this.suitesRegex = instanceConfig.suitesRegex || DEFAULT_SUITES_REGEX;
  this.contentRootUri = instanceConfig.contentRootUri || CONTENT_ROOT_URI;
  this.suiteRootPath = instanceConfig.suiteRootPath || process.cwd();
  this.branch = config.branch;
}

/**
 * Resolve all applicable specs
 * @return {q.promise<{Spec[]},{Error}>}  - all applicable specs
 */
LocalUI5SpecResolver.prototype.resolve = function(){
  var that = this;

  // c:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
  // c:/Users/i076005\git\sap.gantt\gantt.lib\test\sap\gantt\visual’
  //http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html

  // try to resolve git branch
  return Q.Promise(function(resolveFn,rejectFn) {
    git.revparse(['--abbrev-ref', 'HEAD'], function (err, branch) {
      if (err) {
        that.logger.debug('Unable to resolve git branch, cause: ' + err);
        if (!that.branch) {
          rejectFn(new Error('Unable to resolve git branch, no default one specified'));
        }
        branch = that.branch;
        that.logger.debug('Using default branch: ' + branch);
      } else if (branch == 'HEAD') {
        that.logger.debug('Unable to resolve git branch, seems on detached head, reported as: ' + branch);
        if (!that.branch) {
          rejectFn(new Error('Unable to resolve git branch, seems on detached head, no default one specified'));
        }
        branch = that.branch;
        that.logger.debug('Using default branch: ' + branch);
      } else {
        branch = branch.replace(/\n$/, '');
        that.logger.debug('Resolved git branch: ' + branch);
        if (that.branch) {
          branch = that.branch;
          that.logger.debug('Using default branch: ' + branch);
        }
      }
      resolveFn(branch);
    });
  }).then(function(branch){
    return Q.Promise(function(resolveFn,rejectFn) {
      /** @type {Spec[]} */
      var specs = [];

      // log
      that.logger.debug('Resolving suites from: ' + that.suiteRootPath +
      ' using suites glob: ' + that.suitesGlob);

      // resolve suite glob to array of paths
      var suitePathMask = path.normalize(that.suiteRootPath + '/' + that.suitesGlob);
      glob(suitePathMask,function(error,suitePaths){
        if (error) {
          rejectFn(new Error('Error while resolving suites with mask: ' + suitePathMask + ' ,details: ' + error));
        } else {
          that.logger.debug('Suites found: ' + suitePaths.length);

          // resolve spec filter
          var specFilters = that.specFilter !== '*' ? that.specFilter.split(',') : [];

          // resolve spec exclude
          var specExcludes = that.specExclude !== '' ? that.specExclude.split(',') : [];

          //resolve lib filter
          var libFilters = that.libFilter !== '*' ? that.libFilter.split(',') : [];

           //resolve lib exclude
          var libExclude = that.libExclude !== '' ? that.libExclude.split(',') : [];

          // resolve specs from each suite
          suitePaths.forEach(function (suitePath) {

            // couldn't make glob excludes to work so doing it manually
            // ignore if path contains exclude mask
            if (suitePath.indexOf(that.suitesExclude) !== -1) {
              that.logger.debug('Suite path: ' + suitePath + ' matches exclude mask: ' + that.suitesExclude + ', ignoring');
              return;
            }

            // extract lib from
            var suitePathMatch = suitePath.match(that.suitesRegex);
            if (suitePathMatch === null) {
              throw new Error('Could not parse suite path: ' + suitePath);
            }
            var suiteBasePath = suitePathMatch[1].slice(0, -1);  // remove trailing '/' for consistency
            var libName = suitePathMatch[2].slice(0, -1).replace(/\//g, '.');  // remove trailing '/' for consistency

            // filter out this lib if necessary
            if (libFilters.length > 0 && !that._isInArray(libFilters, libName)) {
              that.logger.debug('Drop lib: ' + libName + ' that does not match lib filter: ' + that.libFilter);
              return;
            }
            
            // exclude lib filter
            if(libExclude.length > 0 && that._isInArray(libExclude, libName)) {
              that.logger.debug('Drop lib: ' + libName + ' that does match lib exclude: ' + that.libExclude);
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
            specFileNames.forEach(function (specFileName) {

              // extract spec name from file name
              var specFileNameMatch = specFileName.match(/(\w+)\.spec\.js/);
              if (specFileNameMatch === null) {
                throw Error('Could not parse spec file name: ' + specFileName);
              }
              var specName = specFileNameMatch[1];

              // apply spec filter
              if (specFilters.length > 0 && !that._isInArray(specFilters, specName)) {
                that.logger.debug('Drop spec: ' + specName + ' that does not match spec filter: ' + that.specFilter);
                return;
              }

              // apply spec exclude filter
              if (specExcludes.length > 0 && that._isInArray(specExcludes, specName)) {
                that.logger.debug('Drop spec: ' + specName + ' that does match spec exclude: ' + that.specExclude);
                return;
              }

              var spec = {
                name: specName,
                fullName: libName + '.' + specName,
                lib: libName,
                branch: branch,
                testPath: suiteBasePath + '/' + specFileName,
                contentUrl: that.baseUrl ?
                  (that.baseUrl + '/' + that.contentRootUri + '/' + libName.replace(/\./g, '/') + '/' + specName + '.html') :
                  false
              };

              that.logger.debug('Spec found: ' + JSON.stringify(spec));
              specs.push(spec);
            });
          });

          // return the specs
          resolveFn(specs);
        }
      });
    });
  });
};

LocalUI5SpecResolver.prototype._isInArray = function(filterArray, searchFor) {
  return filterArray.some(function(item) {
    return item.toLowerCase() === searchFor.toLowerCase();
  });
};

module.exports = function(config,instanceConfig,logger){
  return new LocalUI5SpecResolver(config,instanceConfig,logger);
};
