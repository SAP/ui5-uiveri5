'use strict';

var path = require('path');
var fs = require('fs');
var q = require('q');
var selenium_webdriver = require('selenium-webdriver');

/**
 * Utility function that filters a stack trace to be more readable. It removes
 * Jasmine test frames and webdriver promise resolution.
 * @param {string} text Original stack trace.
 * @return {string}
 */
function filterStackTrace(text) {
  if (!text) {
    return text;
  }
  var stackSubstringsToFilter = [
    'node_modules/jasmine/', 'node_modules/selenium-webdriver', 'at Module.', 'at Object.Module.',
    'at Function.Module', '(timers.js:', 'jasminewd2/index.js', 'protractor/lib/'
  ];
  var lines = text.split(/\n/).filter((line) => {
    for (var filter of stackSubstringsToFilter) {
      if (line.indexOf(filter) !== -1) {
        return false;
      }
    }
    return true;
  });
  return lines.join('\n');
}

/**
 * Internal helper for abstraction of polymorphic filenameOrFn properties.
 * @param {object} filenameOrFn The filename or function that we will execute.
 * @param {Array.<object>}} args The args to pass into filenameOrFn.
 * @return {q.Promise} A promise that will resolve when filenameOrFn completes.
 */
function runFilenameOrFn_(configDir, filenameOrFn, args) {
  return q.Promise((resolvePromise) => {
    if (filenameOrFn && !(typeof filenameOrFn === 'string' || typeof filenameOrFn === 'function')) {
      throw new Error('filenameOrFn must be a string or function');
    }
    if (typeof filenameOrFn === 'string') {
      filenameOrFn = require(path.resolve(configDir, filenameOrFn))(args);
    }
    if (typeof filenameOrFn === 'function') {
      var results = q.when(filenameOrFn.apply(null, args), null, (err) => {
        if (typeof err === 'string') {
          err = new Error(err);
        }
        else {
          if (!err.stack) {
            err.stack = new Error().stack;
          }
        }
        err.stack = filterStackTrace(err.stack);
        throw err;
      });
      resolvePromise(results);
    }
    else {
      resolvePromise(undefined);
    }
  });
}

/**
 * Returns false if an error indicates a missing or stale element, re-throws
 * the error otherwise
 *
 * @param {*} The error to check
 * @throws {*} The error it was passed if it doesn't indicate a missing or stale
 *   element
 * @return {boolean} false, if it doesn't re-throw the error
 */
function falseIfMissing(error) {
  if ((error instanceof selenium_webdriver.error.NoSuchElementError) ||
    (error instanceof selenium_webdriver.error.StaleElementReferenceError)) {
    return false;
  }
  else {
    throw error;
  }
}

function writeWhenFree(fileName, content) {
  var deferred = q.defer();
  fs.open(fileName, 'w', function (err) {
    if (!err) {
      fs.writeFile(fileName, content, function () {
        deferred.resolve();
      });
    } else if (err.code === 'EBUSY') {
      setTimeout(function () {
        writeWhenFree(fileName, content);
      }, 50);
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
}

/**
 * Return a boolean given boolean value.
 *
 * @param {boolean} value
 * @returns {boolean} given value
 */
function passBoolean(value) {
  return value;
}

module.exports = {
  filterStackTrace: filterStackTrace,
  runFilenameOrFn_: runFilenameOrFn_,
  falseIfMissing: falseIfMissing,
  passBoolean: passBoolean,
  writeWhenFree: writeWhenFree
};