'use strict';

var path = require('path');
var glob = require('glob');

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

LocalSpecResolver.prototype.resolve = function(){
  var that = this;

  /** @type {Spec} */
  var specs = [];

  that.logger.debug('Resolving specs from: ' + this.specGlob);

  // resolve glob to array of paths
  var specPathMask = path.normalize(process.cwd() + '/' + this.specGlob);
  var specPaths = glob.sync(specPathMask);
  specPaths.forEach(function(specPath){

    // extract spec file name - no extension, no path
    var specMatches = specPath.match(that.specRegex);
    if (specMatches===null){
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
  return specs;
};

module.exports = function(config,instanceConfig,logger){
  return new LocalSpecResolver(config,instanceConfig,logger);
};
