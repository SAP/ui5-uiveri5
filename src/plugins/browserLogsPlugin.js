var _ = require('lodash');
var logging = require('selenium-webdriver').logging;

function BrowserLogsPlugin(config, instanceConfig, logger) {
  this.logger = logger;
  var defaultLevel = logging.Level.OFF;
  var browserLoggingPref = _.get(config, 'runtimes[0].capabilities.loggingPrefs.' + logging.Type.BROWSER, defaultLevel.name).toUpperCase();
  var browserLevel = logging.Level[browserLoggingPref];
  if (browserLevel && browserLevel.value < defaultLevel.value) {
    this.active = true;
  }
}

BrowserLogsPlugin.prototype.specDone = function () {
  return this._logBrowserMessages();
};

BrowserLogsPlugin.prototype._logBrowserMessages = function () {
  var logger = this.logger;

  if (this.active) {
    return browser.driver.manage().logs().get(logging.Type.BROWSER).then(function (browserLogs) {
      var template = _.template('BROWSER LOG: ${level.name}: ${message}');

      _.each(browserLogs, function (browserLog) {
        logger.debug(template(browserLog));
      });
    }).catch(function (e) {
      logger.debug('Could not fetch browser logs: ' + e);
    });
  }
};

module.exports = function (config, instanceConfig, logger) {
  return new BrowserLogsPlugin(config, instanceConfig, logger);
};
