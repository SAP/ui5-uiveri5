// 0 - INFO,ERROR
// 1 - +DEBUG
// 2 - +TRACE
// 3 - +trace data
var level = 0;

var setLevel = function(newLevel){
  level = newLevel;
}

var info = function(msg) {
  console.log('INFO: ' + msg);
};

var error = function(msg) {
  console.log('ERROR: ' + msg);
};

var debug = function(msg) {
  if(level>0) {
    console.log('DEBUG: ' + msg);
  }
};

var trace = function(msg) {
  if(level>1) {
    console.log('TRACE: ' + msg);
  }
};

exports.setLevel = setLevel;
exports.info = info;
exports.error = error;
exports.debug = debug;
exports.trace = trace;
