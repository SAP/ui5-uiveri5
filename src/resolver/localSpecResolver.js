'use strict';

var path = require('path');
var glob = require('glob');
var Q = require('q');
var _ = require('lodash');

var DEFAULT_SPECS_GLOB = './*.spec.js';
var DEFAULT_SPEC_REGEX = '([\\w\\-]+)\\.(?:[\\w\\.]+)';
var FILTER_ALL = '*';
var EXCLUDE_NONE = '';
var LIST_SEPARATOR = ',';

/**
 * @typedef LocalSpecResolverConfig
 * @type {Object}
 * @extends {Config}
 * @property {string|array|object} specs - blob patterns to resolve specs, defaults to: ['./*.spec.js']
 * @property {string} baseUrl - base url to reference, falsy disables page loading, defaults to: falsy
 * @property {string} specExclude - comma separated list of spec names, '' means nothing to be excluded, defaults to ''
 * @property {string} specFilter - comma separated list of spec names, '*' means all, defaults to '*'
 * @property {string} suiteExclude - comma separated list of suite names, '' means nothing to be excluded, defaults to ''
 * @property {string} suiteFilter - comma separated list of suite names, '*' means all, defaults to '*'
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
function LocalSpecResolver(config, instanceConfig, logger) {
  this.logger = logger;

  this.specExclude = config.specExclude || EXCLUDE_NONE;
  this.specFilter = config.specFilter || FILTER_ALL;
  this.suiteExclude = config.suiteExclude || EXCLUDE_NONE;
  this.suiteFilter = config.suiteFilter || FILTER_ALL;
  this.baseUrl = config.baseUrl;
  this.auth = config.auth;
  this.specRegex = instanceConfig.specRegex || DEFAULT_SPEC_REGEX;

  if (_.isEmpty(config.specs)) {
    this.specs = [DEFAULT_SPECS_GLOB];
  } else if (_.isPlainObject(config.specs) || _.isArray(config.specs)) {
    this.specs = config.specs;
  } else {
    this.specs = [config.specs];
  }
}

/**
 * Resolve all applicable specs
 * @return {q.promise<{Spec[]},{Error}>}  - all applicable specs
 */
LocalSpecResolver.prototype.resolve = function () {
  this.logger.debug('Resolving specs from: ' + JSON.stringify(this.specs));

  if (_.isArray(this.specs)) {
    return this._resolveSuite(this.specs);
  } else {
    var suiteFilters = this.suiteFilter === FILTER_ALL ? [] : this.suiteFilter.split(LIST_SEPARATOR);
    var suiteExcludes = this.suiteExclude === EXCLUDE_NONE ? [] : this.suiteExclude.split(LIST_SEPARATOR);

    return Q.Promise.all(Object.keys(this.specs).map(function (suiteName) {
      if (suiteFilters.length > 0 && !this._isInArray(suiteFilters, suiteName)) {
        this.logger.debug('Drop suite: ' + suiteName + ' that does not match suite filter: ' + this.suiteFilter);
        return;
      }
      if (suiteExcludes.length > 0 && this._isInArray(suiteExcludes, suiteName)) {
        this.logger.debug('Drop suite: ' + suiteName + ' that does match suite exclude: ' + this.suiteExclude);
        return;
      }
      var suite = _.isArray(this.specs[suiteName]) ? this.specs[suiteName] : [this.specs[suiteName]];
      return this._resolveSuite(suite);
    }.bind(this))).then(this._flatten);
  }
};

// suite = array of globs
LocalSpecResolver.prototype._resolveSuite = function (suite) {
  // resolve each glob to array of paths
  return Q.Promise.all(suite.map(this._resolveGlob.bind(this))).then(this._flatten);
};

LocalSpecResolver.prototype._resolveGlob = function (specGlob) {
  var that = this;
  return Q.Promise(function (resolveFn, rejectFn) {
    var specPathMask = path.resolve(specGlob);

    glob(specPathMask, function (error, specPaths) {
      if (error) {
        rejectFn(new Error('Error while resolving specs with mask: ' + specPathMask + ' , details: ' + error));
      } else {
        /** @type {Spec} */
        var specs = [];
        var specFilters = that.specFilter === FILTER_ALL ? [] : that.specFilter.split(LIST_SEPARATOR);
        var specExcludes = that.specExclude === EXCLUDE_NONE ? [] : that.specExclude.split(LIST_SEPARATOR);

        specPaths.forEach(function (specPath) {
          // extract spec file name - no extension, no path
          var specMatches = path.basename(specPath).match(that.specRegex);
          if (specMatches === null) {
            throw new Error('Could not parse spec path: ' + specPath);
          }

          var specName = specMatches[1];

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

          /** @type {Spec} */
          var spec = {
            name: specName,
            fullName: specName,
            testPath: specPath,
            contentUrl: that.baseUrl
          };

          specs.push(spec);
          that.logger.debug('Spec found, name: ' + spec.name + ' , path: ' + spec.testPath + ' , url:' + spec.contentUrl);
        });

        // return the specs
        resolveFn(specs);
      }
    });
  });
};

LocalSpecResolver.prototype._isInArray = function (filterArray, searchFor) {
  return filterArray.some(function (item) {
    return item.toLowerCase() === searchFor.toLowerCase();
  });
};

LocalSpecResolver.prototype._flatten = function (paths) {
  return _(paths).flatten().compact().uniqBy('testPath').value();
};

module.exports = function(config, instanceConfig, logger){
  return new LocalSpecResolver(config, instanceConfig, logger);
};
