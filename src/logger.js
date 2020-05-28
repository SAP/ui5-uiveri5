/* eslint no-console: */

var _ = require('lodash');

// 0 - INFO,ERROR
// 1 - +DEBUG
// 2 - +TRACE
// 3 - +DUMP

function ConsoleLogger(level){
  this.level = level;
}

ConsoleLogger.prototype.setLevel = function(newLevel){
  this.level = newLevel;
};

ConsoleLogger.prototype.info = function(msg,args) {
  console.log('INFO: ' + _.template(msg)(args));
};

ConsoleLogger.prototype.error = function(msg,args) {
  console.log('ERROR: ' + _.template(msg)(args));
};

ConsoleLogger.prototype.debug = function(msg,args) {
  if(this.level>0) {
    console.log('DEBUG: ' + _.template(msg)(args));
  }
};

ConsoleLogger.prototype.trace = function(msg,args) {
  if(this.level>1) {
    console.log('TRACE: ' + _.template(msg)(args));
  }
};

ConsoleLogger.prototype.dump = function(msg,args) {
  if(this.level>2) {
    console.log('DUMP: ' + _.template(msg)(args));
  }
};
module.exports = function (level) {
  return new ConsoleLogger(level);
};

/*
exports.setLevel = setLevel;
exports.info = info;
exports.error = error;
exports.debug = debug;
exports.trace = trace;
*/
