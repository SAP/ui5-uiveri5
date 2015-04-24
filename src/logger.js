var isDebug = false;

var enableDebug = function(isDebugArg) {
    isDebug = isDebugArg;
};

var debug = function(msg) {
    if (isDebug) {
        console.log('DEBUG: ' + msg);
    }
};

var error = function(msg) {
    console.log('ERROR: ' + msg);
};

var info = function(msg) {
  console.log('INFO: ' + msg);
};

exports.enableDebug = enableDebug;
exports.debug = debug;
exports.error = error;
exports.info = info;
