function JasmineSaucelabsReporter(config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
  this.actionInterceptor = actionInterceptor;
  this.expectationInterceptor = expectationInterceptor;
  this.runningOnSauceLabs = !!(this.config.seleniumAddress && this.config.seleniumAddress.match(/saucelabs\.com/));
}

JasmineSaucelabsReporter.prototype.suiteStarted = function () {
  this._executeSauceLabsScript('sauce:context=Suite started: ' + this.collector.getCurrentSuite().name);
};

JasmineSaucelabsReporter.prototype.specStarted = function () {
  this._executeSauceLabsScript('sauce:context=Spec started: ' + this.collector.getCurrentSpec().name);
};

JasmineSaucelabsReporter.prototype.specDone = function () {
  this._executeSauceLabsScript('sauce:context=Spec done: ' + this.collector.getCurrentSpec().name);
};

JasmineSaucelabsReporter.prototype.suiteDone = function () {
  this._executeSauceLabsScript('sauce:context=Suite done: ' + this.collector.getCurrentSuite().name);
};

JasmineSaucelabsReporter.prototype.jasmineDone = function () {
  var overview = this.collector.getOverview();
  this._executeSauceLabsScript('sauce:job-result=' + overview.status);
};

JasmineSaucelabsReporter.prototype.register = function (jasmineEnv) {
  jasmineEnv.addReporter(this);

  this.collector.onAuthStarted(function () {
    this._executeSauceLabsScript('sauce: disable log');
  }.bind(this));

  this.collector.onAuthDone(function () {
    this._executeSauceLabsScript('sauce: enable log');
  }.bind(this));

  this.expectationInterceptor.onExpectation(function (expectation) {
    this._executeSauceLabsScript('sauce:context=' + this._createFullMessage(expectation));
  }.bind(this));

  this.actionInterceptor.onAction(function (action) {
    var locatorLog = (action.elementLocator ? 'locator "' + action.elementLocator + '" and' : '') + ' ID "' + action.elementId + '"';
    if (this.collector.isAuthInProgress()) {
      this._executeSauceLabsScript('sauce: enable log');
      this._executeSauceLabsScript('sauce:context=Perform authentication action: ' + action.name + ' on element with ' + locatorLog);
      this._executeSauceLabsScript('sauce: disable log');
    } else {
      this._executeSauceLabsScript('sauce:context=Perform action: ' + action.name +
        (action.value ? ' with value "' + action.value : '') + '" on element with ' + locatorLog);
    }
  }.bind(this));
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

JasmineSaucelabsReporter.prototype._executeSauceLabsScript = function (script) {
  if (this.runningOnSauceLabs) {
    // execute SauceLabs scripts only when running on SauceLabs.
    // otherwise the scripts fail with "javascript error: Unexpected identifier"
    browser.executeScript(script);
  }
};

module.exports = function (config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor) {
  return new JasmineSaucelabsReporter(config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor);
};
