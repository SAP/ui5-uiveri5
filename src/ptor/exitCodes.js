'use strict';

var CONFIG_ERROR_CODE = 105;
var BROWSER_CONNECT_ERROR_CODE = 135;
var KITCHEN_SINK_CODE = 199;

function IError() {
  Error.apply(this, arguments);
}
IError.prototype = Object.assign({}, Error.prototype);
IError.prototype.constructor = IError;

function ProtractorError (logger, message, code, error) {
  Error.call(this, message);
  this.message = message;
  this.code = code;
  // replacing the stack trace with the thrown error stack trace.
  if (error) {
    var protractorError = error;
    this.stack = protractorError.stack;
  }
  ProtractorError.log(logger, this.code, this.message, this.stack);
  if (!ProtractorError.SUPRESS_EXIT_CODE) {
    process.exit(this.code);
  }
}
ProtractorError.prototype = Object.assign({}, Error.prototype);
ProtractorError.prototype.constructor = ProtractorError;

ProtractorError.log = function (logger, code, message, stack) {
  var messages = message.split('\n');
  if (messages.length > 1) {
    message = messages[0];
  }
  logger.error('Error code: ' + code);
  logger.error('Error message: ' + message);
  logger.error(stack);
};

ProtractorError.CODE = KITCHEN_SINK_CODE;
ProtractorError.SUPRESS_EXIT_CODE = false;

/**
 * Configuration file error
 */
function ConfigError (logger, message, error) {
  ProtractorError.call(this, logger, message, ConfigError.CODE, error);
}
ConfigError.prototype = Object.assign({}, ProtractorError.prototype);
ConfigError.prototype.constructor = ConfigError;

ConfigError.CODE = CONFIG_ERROR_CODE;

/**
 * Browser errors including getting a driver session, direct connect, etc.
 */
function BrowserError (logger, message) {
  ProtractorError.call(logger, message, BrowserError.CODE);
}
BrowserError.prototype = Object.assign({}, ProtractorError.prototype);
BrowserError.prototype.constructor = BrowserError;

BrowserError.CODE = BROWSER_CONNECT_ERROR_CODE;
BrowserError.ERR_MSGS = [
  'ECONNREFUSED connect ECONNREFUSED', 'Sauce Labs Authentication Error',
  'Invalid username or password'
];

function ErrorHandler() {
}

ErrorHandler.isError = function (errMsgs, e) {
  if (errMsgs && errMsgs.length > 0) {
    for (var errPos in errMsgs) {
      var errMsg = errMsgs[errPos];
      if (e.message && e.message.indexOf(errMsg) !== -1) {
        return true;
      }
    }
  }
  return false;
};

ErrorHandler.parseError = function (e) {
  if (ErrorHandler.isError(ConfigError.ERR_MSGS, e)) {
    return ConfigError.CODE;
  }
  if (ErrorHandler.isError(BrowserError.ERR_MSGS, e)) {
    return BrowserError.CODE;
  }
  return null;
};

module.exports = {
  IError: IError,
  ProtractorError: ProtractorError,
  ConfigError: ConfigError,
  BrowserError: BrowserError,
  ErrorHandler: ErrorHandler
};
