var _ = require('lodash');
var ExpectationPlugin = require('./expectationPlugin');
var ActionPlugin = require('./actionPlugin');

function JasmineSaucelabsReporter(config, instanceConfig, logger, collector) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
  this.expectationPlugin = new ExpectationPlugin();
  this.actionPlugin = new ActionPlugin();
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

  this.expectationPlugin.onExpectation(function (expectation, specResult, category) {
    browser.executeScript('sauce:context=' + _.last(specResult[category]).fullMessage);
  });
  this.actionPlugin.onAction(function (action) {
    browser.executeScript('sauce:context=Perform action: ' + action.name + ' with value "' + action.value +
      '" on element with ' + (action.elementLocator ? 'locator "' + action.elementLocator + '" and' : '') + ' ID "' + action.elementId + '"');
  });
};

module.exports = function (config, instanceConfig, logger, collector) {
  return new JasmineSaucelabsReporter(config, instanceConfig, logger, collector);
};
