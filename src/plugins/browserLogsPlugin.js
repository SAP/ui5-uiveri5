var _ = require('lodash');
var logging = require('selenium-webdriver').logging;

var DEFAULT_LOG_LEVEL = logging.Level.OFF;

function BrowserLogsPlugin(config, instanceConfig, logger) {
  this.config = config;
  this.logger = logger;
  this.browserLoggingPref = _.get(config, 'log.browser.level', DEFAULT_LOG_LEVEL.name).toUpperCase();

  var browserLevel = logging.Level[this.browserLoggingPref];
  if (browserLevel && browserLevel.value < DEFAULT_LOG_LEVEL.value) {
    this.active = true;
  }
}

BrowserLogsPlugin.prototype.specDone = function () {
  return this._logBrowserMessages();
};

BrowserLogsPlugin.prototype.onConnectionSetup = function (capabilities) {
  if (_.get(this, 'config.log.browser.level')) {
    capabilities.loggingPrefs = capabilities.loggingPrefs || {};
    capabilities.loggingPrefs.browser = this.config.log.browser.level;
  }
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
