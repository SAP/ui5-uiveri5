/* eslint no-console: */

var _ = require('lodash');
function BrowserLogsPlugin(config, instanceConfig, logger) {
  this.level = _.get(config, 'log.browser.level', 'error');
  this.logger = logger;
}

BrowserLogsPlugin.prototype.suiteStarted = function () {
  var that = this;
  if (that.level) {
    browser.executeScriptHandleErrors('startLogCollection', {level: that.level})
      .catch(function () {
        // swallow error, already logged on debug level, avoid double logs
      });
  }
};

BrowserLogsPlugin.prototype.specDone = function () {
  browser.executeScriptHandleErrors('getAndClearLogs')
    .then(function (logs) {
      var template = _.template('BROWSER LOG: ${level}: ${message}');
      _.each(logs, function (log) {
        console.log(template(log));
      });
    })
    .catch(function () {
      // swallow error, already logged on debug level, avoid double logs
    });
};

BrowserLogsPlugin.prototype.suiteDone = function () {
  browser.executeScriptHandleErrors('stopLogsCollection')
    .catch(function () {
      // swallow error, already logged on debug level, avoid double logs
    });
};

module.exports = function (config, instanceConfig, logger) {
  return new BrowserLogsPlugin(config, instanceConfig, logger);
};
