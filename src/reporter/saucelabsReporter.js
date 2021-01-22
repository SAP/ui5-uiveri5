var _ = require('lodash');
var URL = require('url').URL;

// TODO test
function JasmineSaucelabsReporter(config, instanceConfig, logger, collector, expectationInterceptor) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
  this.expectationInterceptor = expectationInterceptor;
}

JasmineSaucelabsReporter.prototype.jasmineStarted = function () {
  this._getSessionId().then(function (sessionId) {
    var resultsUrl;
    if (this.instanceConfig.resultsUrl) {
      resultsUrl = _.template(this.instanceConfig.resultsUrl.replace(/\\/g, ''))({
        sessionId: sessionId
      });
      
      if (this.instanceConfig.loginUrl) {
        var loginUrl = new URL(this.instanceConfig.loginUrl);
        loginUrl.searchParams.append('RelayState', resultsUrl);
        resultsUrl = loginUrl.toString();
      }
    }

    if (resultsUrl) {
      this.logger.info('SauceLabs results URL is: ' + resultsUrl);
    }
  }.bind(this));
};

JasmineSaucelabsReporter.prototype.suiteStarted = function () {
  browser.executeScript('sauce:context=Suite started: ' + this.collector.getCurrentSuite().name);
};

JasmineSaucelabsReporter.prototype.specStarted = function () {
  browser.executeScript('sauce:context=Spec started: ' + this.collector.getCurrentSpec().name);
};

JasmineSaucelabsReporter.prototype.specDone = function () {
  browser.executeScript('sauce:context=Spec done: ' + this.collector.getCurrentSpec().name);
};

JasmineSaucelabsReporter.prototype.suiteDone = function () {
  browser.executeScript('sauce:context=Suite done: ' + this.collector.getCurrentSuite().name);
};

JasmineSaucelabsReporter.prototype.jasmineDone = function () {
  var overview = this.collector.getOverview();
  browser.executeScript('sauce:job-result=' + overview.status);
};

JasmineSaucelabsReporter.prototype.register = function (jasmineEnv) {
  jasmineEnv.addReporter(this);

  this.collector.onAuthStarted(function () {
    browser.executeScript('sauce: disable log');
  });

  this.collector.onAuthDone(function () {
    browser.executeScript('sauce: enable log');
  });

  this.expectationInterceptor.onExpectation(function (expectation) {
    browser.executeScript('sauce:context=' + this._createFullMessage(expectation));
  }.bind(this));

  // TODO refactor
  browser.plugins_.addPlugin({
    onElementAction: this._onAction.bind(this)
  });
};

JasmineSaucelabsReporter.prototype._onAction = function (action) {
  var locatorLog = (action.elementLocator ? 'locator "' + action.elementLocator + '" and' : '') + ' ID "' + action.elementId + '"';
  if (this.collector.isAuthInProgress()) {
    browser.executeScript('sauce: enable log');
    browser.executeScript('sauce:context=Perform authentication action: ' + action.name + ' on element with ' + locatorLog);
    browser.executeScript('sauce: disable log');
  } else {
    browser.executeScript('sauce:context=Perform action: ' + action.name +
      (action.value ? ' with value "' + action.value : '') + '" on element with ' + locatorLog);
  }
};

JasmineSaucelabsReporter.prototype._createFullMessage = function (expectation) {
  var sExpectation = 'Expectation ' + (expectation.passed ? 'passed' : 'failed') + '.';
  if (expectation.matcherName) {
    sExpectation += ' Expected "' + expectation.actual + '" ' + expectation.matcherName + ' "' + expectation.expected + '".';
  }
  if (expectation.message) {
    sExpectation += ' Message: "' + expectation.message + '". ';
  }
  if (!expectation.passed && expectation.error) {
    sExpectation += ' Error: "' + expectation.error + '". ';
  }

  return sExpectation;
};

JasmineSaucelabsReporter.prototype._getSessionId = function () {
  return browser.driver.getSession().then(function (session) {
    this.logger.trace('SauceLabs session ID: ' + session.id_);
    return session.id_;
  }.bind(this));
};

module.exports = function (config, instanceConfig, logger, collector, expectationInterceptor) {
  return new JasmineSaucelabsReporter(config, instanceConfig, logger, collector, expectationInterceptor);
};
