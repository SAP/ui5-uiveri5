/* eslint no-console: */

var _ = require('lodash');
const chalk = require('chalk');


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
  let color = chalk.cyan;
  
  if (msg.includes('FAIL')){
    color = chalk.redBright;
  }
  if (msg.includes('PASSED')){
    color = chalk.greenBright;
  }
  if (msg.includes('started')){
    color = chalk.white;
  }
  if (msg.includes('summary')){
    color = chalk.yellowBright;
  }

  console.log(color('INFO: ' + _.template(msg)(args)));
};

ConsoleLogger.prototype.error = function(msg,args) {
  console.log(chalk.redBright('ERROR: ' + _.template(msg)(args)));
};

ConsoleLogger.prototype.debug = function(msg,args) {
  if(this.level>0) {
    console.log(chalk.yellowBright('DEBUG: ' + _.template(msg)(args)));
  }
};

ConsoleLogger.prototype.trace = function(msg,args) {
  if(this.level>1) {
    console.log(chalk.yellowBright('TRACE: ' + _.template(msg)(args)));
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
