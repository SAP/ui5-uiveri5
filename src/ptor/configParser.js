'use strict';

var glob = require('glob');
var path = require('path');
var exitCodes = require('./exitCodes');
var logger = require('../logger');

function ConfigParser() {
  // Default configuration.
  this.config_ = {
    specs: [],
    multiCapabilities: [],
    verboseMultiSessions: false,
    rootElement: '',
    allScriptsTimeout: 11000,
    getPageTimeout: 10000,
    params: {},
    framework: 'jasmine',
    jasmineNodeOpts: { showColors: true, defaultTimeoutInterval: (30 * 1000) },
    seleniumArgs: [],
    configDir: './',
    noGlobals: false,
    plugins: []
  };
}
/**
 * Resolve a list of file patterns into a list of individual file paths.
 *
 * @param {Array.<string> | string} patterns
 * @param {=boolean} opt_omitWarnings Whether to omit did not match warnings
 * @param {=string} opt_relativeTo Path to resolve patterns against
 *
 * @return {Array} The resolved file paths.
 */
ConfigParser.resolveFilePatterns = function (patterns, opt_omitWarnings, opt_relativeTo) {
  var resolvedFiles = [];
  var cwd = opt_relativeTo || process.cwd();
  patterns = (typeof patterns === 'string') ? [patterns] : patterns;
  if (patterns) {
    for (var fileName of patterns) {
      var matches = glob.hasMagic(fileName) ? glob.sync(fileName, { cwd }) : [fileName];
      if (!matches.length && !opt_omitWarnings) {
        logger.info('pattern ' + fileName + ' did not match any files.');
      }
      for (var match of matches) {
        var resolvedPath = path.resolve(cwd, match);
        resolvedFiles.push(resolvedPath);
      }
    }
  }
  return resolvedFiles;
};

/**
 * Returns only the specs that should run currently based on `config.suite`
 *
 * @return {Array} An array of globs locating the spec files
 */
ConfigParser.getSpecs = function (config) {
  var specs = [];
  if (config.suite) {
    config.suite.split(',').forEach((suite) => {
      var suiteList = config.suites ? config.suites[suite] : null;
      if (suiteList == null) {
        throw new exitCodes.ConfigError(logger, 'Unknown test suite: ' + suite);
      }
      union(specs, makeArray(suiteList));
    });
    return specs;
  }
  if (config.specs.length > 0) {
    return config.specs;
  }
  Object.keys(config.suites || {}).forEach((suite) => {
    union(specs, makeArray(config.suites[suite]));
  });
  return specs;
};

/**
 * Add the options in the parameter config to this runner instance.
 *
 * @private
 * @param {Object} additionalConfig
 * @param {string} relativeTo the file path to resolve paths against
 */
ConfigParser.prototype.addConfig_ = function (additionalConfig) {
  merge_(this.config_, additionalConfig);
};

/**
 * Public function specialized towards merging in config from argv
 *
 * @public
 * @param {Object} argv
 */
ConfigParser.prototype.addConfig = function (argv) {
  this.addConfig_(argv, process.cwd());
  return this;
};

/**
 * Public getter for the final, computed config object
 *
 * @public
 * @return {Object} config
 */
ConfigParser.prototype.getConfig = function () {
  return this.config_;
};

/**
 * Merge config objects together.
 *
 * @private
 * @param {Object} into
 * @param {Object} from
 *
 * @return {Object} The 'into' config.
 */
function merge_ (into, from) {
  for (var key in from) {
    if (into[key] instanceof Object && !(into[key] instanceof Array) &&
      !(into[key] instanceof Function)) {
      merge_(into[key], from[key]);
    }
    else {
      into[key] = from[key];
    }
  }
  return into;
}

/**
 * Returns the item if it's an array or puts the item in an array
 * if it was not one already.
 */
function makeArray (item) {
  return Array.isArray(item) ? item : [item];
}

/**
 * Adds to an array all the elements in another array without adding any
 * duplicates
 *
 * @param {string[]} dest The array to add to
 * @param {string[]} src The array to copy from
 */
function union (dest, src) {
  var elems = {};
  for (var destKey in dest) {
    elems[dest[destKey]] = true;
  }
  for (var key in src) {
    if (!elems[src[key]]) {
      dest.push(src[key]);
      elems[src[key]] = true;
    }
  }
}

module.exports.ConfigParser = ConfigParser;
