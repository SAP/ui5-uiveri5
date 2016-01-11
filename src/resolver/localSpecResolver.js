'use strict';

var path = require('path');
var glob = require('glob');
var Q = require('q');

var DEFAULT_SPECS_GLOB = './*.spec.js';
var DEFAULT_SPEC_REGEX = '(?:\\w\\:)?\\/(?:[\\w\\-\\.]+\\/)*([\\w\\-]+)\\.(?:[\\w\\.]+)';

/**
 * @typedef LocalSpecResolverConfig
 * @type {Object}
 * @extends {Config}
 * @property {string} specs - blob pattern to resolve specs, defaults to: './*.spec.js'
 * @property {string} baseUrl - base url to reference, falsy disables page loading, defaults to: falsy
 */

/**
 * @typedef LocalSpecResolverInstanceConfig
 * @type {Object}
 * @property {string} specRegex - spec glob, default to all spec.js files
 */

/**
 * Resolves specs
 * @constructor
 * @param {LocalSpecResolverConfig} config
 * @param {LocalSpecResolverInstanceConfig} instanceConfig
 * @param {Logger} logger
 */
function LocalSpecResolver(config,instanceConfig,logger){
  //this.config  = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;

  this.specGlob = config.specs || DEFAULT_SPECS_GLOB;
  this.baseUrl = config.baseUrl;
  this.auth = config.auth;
  this.specRegex = instanceConfig.specRegex || DEFAULT_SPEC_REGEX;
}

/**
 * Resolve all applicable specs
 * @return {q.promise<{Spec[]},{Error}>}  - all applicable specs
 */
LocalSpecResolver.prototype.resolve = function(){
  var that = this;

  that.logger.debug('Resolving specs from: ' + this.specGlob);

  // resolve glob to array of paths
  return Q.Promise(function(resolveFn,rejectFn) {
    var specPathMask = path.resolve(that.specGlob);
    glob(specPathMask,function(error,specPaths){
      if (error){
        rejectFn(new Error('Error while resolving specs with mask: ' + specPathMask + ' ,details: ' + error));
      } else {
        /** @type {Spec} */
        var specs = [];

        specPaths.forEach(function(specPath) {
          // extract spec file name - no extension, no path
          var specMatches = specPath.match(that.specRegex);
          if (specMatches === null) {
            throw new Error('Could not parse spec path: ' + specPath);
          }
          var specName = specMatches[1];

          /** @type {Spec} */
          var spec = {
            name: specName,
            fullName: specName,
            testPath: specPath,
            contentUrl: that.baseUrl
          };

          specs.push(spec);
          that.logger.debug('Spec found, name: ' + spec.name + ' ,path: ' + spec.testPath + ' ,url:' + spec.contentUrl);
        });

        // return the specs
        resolveFn(specs);
      }
    });
  });
};

module.exports = function(config,instanceConfig,logger){
  return new LocalSpecResolver(config,instanceConfig,logger);
};
