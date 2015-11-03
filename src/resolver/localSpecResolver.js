'use strict';

var path = require('path');
var glob = require('glob');

var DEFAULT_SPECS_GLOB = './*.spec.js';
var DEFAULT_SPEC_REGEX = '((?:\\w\\:)?\\/(?:[\\w\\-\\.]+\\/)*)([\\w\\-]+)\\.(?:[\\w\\.]+)';

/**
 * @typedef LocalSpecResolverConfig
 * @type {Object}
 * @extends {Config}
 * @property {string} specs - blob pattern to resolve specs, defaults to: './*.spec.js'
 * @property {string} baseUrl - base url to reference, falsy disables page loading, defaults to: falsy
 * @property {Object} auth - authentication scheme, undefined disables is, defaults to: undefined
 * @property {string} auth.type - authentication type, defaults to: basic
 * @property {string} auth.user - user to set in baseUrl
 * @property {string} auth.pass - pass to set in baseUrl
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
    var specBasePath = specMatches[1].slice(0,-1);  // remove trailing '/' for consistency
    var specName = specMatches[2];

    // form contentUrl, add user and pass
    var contentUrlWithAuth = false;
    if (that.baseUrl) {
      if (that.auth) {
        if (that.auth.type == 'basic') {
          if (that.auth.user && that.auth.pass) {
            var baseUrlMatches = that.baseUrl.match(/(\w*\:?\/\/)(.+)/);
            if (baseUrlMatches === null) {
              throw new Error('Could not parse baseUrl: ' + that.baseUrl);
            }
            contentUrlWithAuth = baseUrlMatches[1] + that.auth.user + ':' + that.auth.pass + '@' +
            baseUrlMatches[2];
          } else {
            that.logger.debug('Basic auth requested but user or pass is not specified');
          }
        } else if (that.auth.type == 'fiori-form') {
          // just log, actual work will follow in get()
          that.logger.debug('Auth type: fiori-form requested, will be handled when page is opened');
          contentUrlWithAuth = that.baseUrl;
        } else {
          that.logger.debug('Auth type not supported: ' + that.auth.type + ' ,only supported: basic');
        }
      }else{
        contentUrlWithAuth = that.baseUrl;
      }
    }

    /** @type {Spec} */
    var spec = {
      name: specName,
      fullName: specName,
      testPath: specPath,
      testBasePath: specBasePath,
      contentUrl: contentUrlWithAuth
    };

    specs.push(spec);
    that.logger.debug('Spec found, name: ' + spec.name + ' ,path: ' + spec.path + ' ,url:' + that.baseUrl);
  });

  // return the specs
  return specs;
};

module.exports = function(config,instanceConfig,logger){
  return new LocalSpecResolver(config,instanceConfig,logger);
};
