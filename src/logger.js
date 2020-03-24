/* eslint no-console: */

var _ = require('lodash');

// 0 - INFO,ERROR
// 1 - +DEBUG
// 2 - +TRACE
// 3 - +DUMP

function ConsoleLogger() {
}

ConsoleLogger.prototype.setLevel = function (newLevel) {
  this.level = newLevel;
};

ConsoleLogger.prototype.info = function (msg, args) {
  console.log('INFO: ' + _.template(msg)(args));
};

ConsoleLogger.prototype.error = function (msg, args) {
  console.log('ERROR: ' + _.template(msg)(args));
};

ConsoleLogger.prototype.debug = function (msg, args) {
  if (this.level > 0) {
    console.log('DEBUG: ' + _.template(msg)(args));
  }
};

ConsoleLogger.prototype.trace = function (msg, args) {
  if (this.level > 1) {
    console.log('TRACE: ' + _.template(msg)(args));
  }
};

ConsoleLogger.prototype.dump = function (msg, args) {
  if (this.level > 2) {
    console.log('DUMP: ' + _.template(msg)(args));
  }
};

// rely on module caching to create a singleton,
// so that we have the same log level across all modules
module.exports = new ConsoleLogger();

/*
exports.setLevel = setLevel;
exports.info = info;
exports.error = error;
exports.debug = debug;
exports.trace = trace;
*/
