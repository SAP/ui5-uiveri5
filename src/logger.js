// 0 - INFO,ERROR
// 1 - +DEBUG
// 2 - +TRACE
// 3 - +trace data

function ConsoleLogger(level){
  this.level = level;
}

ConsoleLogger.prototype.setLevel = function(newLevel){
  this.level = newLevel;
};

ConsoleLogger.prototype.info = function(msg) {
  console.log('INFO: ' + msg);
};

ConsoleLogger.prototype.error = function(msg) {
  console.log('ERROR: ' + msg);
};

ConsoleLogger.prototype.debug = function(msg) {
  if(this.level>0) {
    console.log('DEBUG: ' + msg);
  }
};

//TODO placeholders and var args
//TODO stringity for objects and arrays
ConsoleLogger.prototype.trace = function(msg) {
  if(this.level>1) {
    console.log('TRACE: ' + msg);
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
