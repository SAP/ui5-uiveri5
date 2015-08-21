'use strict';

var path = require('path');
var glob = require('glob');

var SPECS_GLOB = './*.spec.js';

/**
 * @typedef LocalSpecResolverConfig
 * @type {Object}
 * @extends {Config}
 * @property {String} specs - blob pattern to resolve specs, defaults to: './*.spec.js'
 * @property {String} baseUrl - base url to reference, falsy disables page loading, defaults to: falsy
 * @property {Object} auth - authentication scheme, undefined disables is, defaults to: undefined
 * @property {String} auth.type - authentication type, defaults to: basic
 * @property {String} auth.user - user to set in baseUrl
 * @property {String} auth.pass - pass to set in baseUrl
 */

/**
 * Resolves specs
 * @constructor
 * @param {LocalSpecResolverConfig} config
 * @param {Logger} logger
 */
function LocalSpecResolver(config,logger){
  this.config  = config;
  this.logger = logger;
}

LocalSpecResolver.prototype.resolve = function(){
  var that = this;

  // defaults
  var specGlob = this.config.specs || SPECS_GLOB;

  /** @type {Spec} */
  var specs = [];

  that.logger.debug('Resolving specs from: ' + specGlob);

  // resolve glob to array of paths
  var specPathMask = path.normalize(process.cwd() + '/' + specGlob);
  var specPaths = glob.sync(specPathMask);
  specPaths.forEach(function(specPath){

    // extract spec file name - no extension, no path
    var specMatches = specPath.match(/((?:\w\:)?\/(?:[\w\-]+\/)*)([\w\-]+)\.(?:[\w\.]+)/);
    if (specMatches===null){
      throw new Error('Could not parse spec path: ' + specPath);
    }
    var specBasePath = specMatches[1].slice(0,-1);  // remove trailing '/' for consistency
    var specName = specMatches[2];

    // form contentUrl, add user and pass
    var contentUrlWithAuth = false;
    if (that.config.baseUrl) {
      if (that.config.auth) {
        if (that.config.auth.type == 'basic') {
          if (that.config.auth.user && that.config.auth.pass) {
            var baseUrlMatches = that.config.baseUrl.match(/(\w*\:?\/\/)(.+)/);
            if (baseUrlMatches === null) {
              throw new Error('Could not parse baseUrl: ' + that.config);
            }
            contentUrlWithAuth = baseUrlMatches[1] + that.config.auth.user + ':' + that.config.auth.pass + '@' +
            baseUrlMatches[2];
          } else {
            that.logger.debug('Basic auth requested but user or pass is not specified');
          }
        } else {
          that.logger.debug('Auth type not supported: ' + that.config.auth.type + ' ,only supported: basic');
        }
      }else{
        contentUrlWithAuth = that.config.baseUrl;
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
    that.logger.debug('Spec found, name: ' + spec.name + ' ,path: ' + spec.path + ' ,url:' + that.config.baseUrl);
  });

  // return the specs
  return specs;
};

module.exports = function(config, logger){
  return new LocalSpecResolver(config, logger);
};
