/* eslint no-console: */

var _ = require('lodash');
var clientsidescripts = require('../scripts/clientsidescripts');

function BrowserLogsPlugin(config, instanceConfig, logger) {
  this.level = _.get(config, 'log.browser.level', 'error');
  this.logger = logger;
}

BrowserLogsPlugin.prototype.suiteStarted = function () {
  var that = this;
  if (that.level) {
    return browser.executeScript(clientsidescripts.collectLogs, {
      level: that.level
    }).then(function () {
      that.logger.debug('Collecting browser logs with level ' + that.level);
    }).catch(function (e) {
      that.logger.debug('Error while collecting browser logs. Details: ' + e);
    });
  }
};

BrowserLogsPlugin.prototype.specDone = function () {
  var that = this;
  return browser.executeScript(clientsidescripts.getAndClearLogs)
    .then(function (logs) {
      var template = _.template('BROWSER LOG: ${level}: ${message}');
      _.each(logs, function (log) {
        console.log(template(log));
      });
    }).catch(function (e) {
      that.logger.debug('Error while reading browser logs. Details: ' + e);
    });
};

BrowserLogsPlugin.prototype.suiteDone = function () {
  var that = this;
  return browser.executeScript(clientsidescripts.stopLogsCollection)
    .catch(function (e) {
      that.logger.debug('Error while collecting browser logs. Details: ' + e);
    });
};

module.exports = function (config, instanceConfig, logger) {
  return new BrowserLogsPlugin(config, instanceConfig, logger);
};
