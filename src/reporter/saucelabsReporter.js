function JasmineSaucelabsReporter(config, instanceConfig, logger, collector) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
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

  ['click', 'sendKeys'].forEach(this._registerOnAction.bind(this));
  this._registerOnExpectation();
};

JasmineSaucelabsReporter.prototype._registerOnAction = function (action) {
  var originalAction = protractorModule.parent.parent.exports.WebElement.prototype[action];

  protractorModule.parent.parent.exports.WebElement.prototype[action] = function () {
    var element = this;
    var actionValue = arguments[0];

    // TODO: save the locator which was used to find the element
    return element.getAttribute('id').then(function (elementId) {
      var onAction = function () {
        browser.executeScript('sauce:context=Perform action: ' + action + ' with value "' + actionValue + '" on "' + elementId + '"');
      };
      return originalAction.call(element, actionValue).then(onAction, onAction);
    });
  };
};

// should be called after browser.getProcessedConfig()
JasmineSaucelabsReporter.prototype._registerOnExpectation = function () {
  var originalAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;

  jasmine.Spec.prototype.addExpectationResult = function (passed, expectation) {
    var sExpectation = 'Expectation ' + (passed ? 'passed' : 'failed') + '.';

    if (expectation.matcherName) {
      sExpectation += ' Expected "' + expectation.actual + '" ' + expectation.matcherName + ' "' + expectation.expected + '".';
    }
    if (expectation.message) {
      sExpectation += ' Message: "' + expectation.message + '". ';
    }
    if (expectation.error) {
      sExpectation += ' Error: "' + expectation.error + '". ';
    }

    browser.executeScript('sauce:context=' + sExpectation);

    return originalAddExpectationResult.apply(this, arguments);
  };
};

module.exports = function (config, instanceConfig, logger, collector) {
  return new JasmineSaucelabsReporter(config, instanceConfig, logger, collector);
};
