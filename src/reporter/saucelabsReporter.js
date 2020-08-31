function JasmineSaucelabsReporter(config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
  this.actionInterceptor = actionInterceptor;
  this.expectationInterceptor = expectationInterceptor;
}

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

  this.expectationInterceptor.onExpectation(function (expectation) {
    browser.executeScript('sauce:context=' + this._createFullMessage(expectation));
  }.bind(this));
  this.actionInterceptor.onAction(function (action) {
    browser.executeScript('sauce:context=Perform action: ' + action.name + ' with value "' + action.value +
      '" on element with ' + (action.elementLocator ? 'locator "' + action.elementLocator + '" and' : '') + ' ID "' + action.elementId + '"');
  });
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

module.exports = function (config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor) {
  return new JasmineSaucelabsReporter(config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor);
};
