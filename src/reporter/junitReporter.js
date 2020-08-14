var xmlBuilder = require('xmlbuilder');
var utils = require('./reporterUtils');

var DEFAULT_REPORT_NAME = 'target/report/junitReport.xml';

function JUnitReporter(config,instanceConfig,logger,collector) {
  this.config = config || {};
  this.instanceConfig  = instanceConfig || {};
  this.logger = logger;
  this.collector = collector;
}

function JasmineJUnitReporter(config,instanceConfig,logger,collector) {
  this.config = config || {};
  this.instanceConfig  = instanceConfig || {};
  this.collector = collector;
  this.logger = logger;
  this.reportName = instanceConfig.reportName || DEFAULT_REPORT_NAME;
}

JasmineJUnitReporter.prototype.jasmineStarted = function() {
  utils.deleteReport(this.reportName, 'JUnit');
};

JasmineJUnitReporter.prototype.suiteStarted = function() {

};

JasmineJUnitReporter.prototype.specStarted = function() {
};

JasmineJUnitReporter.prototype.specDone = function() {
};

JasmineJUnitReporter.prototype.suiteDone = function() {
};

JasmineJUnitReporter.prototype.jasmineDone = function() {
  this.xmlOutput = xmlBuilder.create('testsuites', {version: '1.0', encoding: 'UTF-8'}).att({
    platformName: this.collector.overview.meta.runtime.platformName,
    platformVersion: this.collector.overview.meta.runtime.platformVersion,
    platformResolution: this.collector.overview.meta.runtime.platformResolution,
    browser: this.collector.overview.meta.runtime.browserName,
    browserVersion: this.collector.overview.meta.runtime.browserVersion,
    ui5_theme: this.collector.overview.meta.runtime.ui5.theme,
    ui5_direction: this.collector.overview.meta.runtime.ui5.direction,
    ui5_mode: this.collector.overview.meta.runtime.ui5.mode
  });

  this._suiteAsXml();
  utils.saveReport(this.reportName, this.xmlOutput);
};

JasmineJUnitReporter.prototype._suiteAsXml = function() {
  var that = this;
  var collector = this.collector.getOverview();

  collector.suites.forEach(function(suite){
    var suiteDetails =  {
      name: (that.instanceConfig.prefix || '')+suite.name+(that.instanceConfig.postfix || ''),
      timestamp: new Date(),
      hostname: 'localhost' || that.config.seleniumAddress,
      errors: suite.statistic.specs.failed,
      tests: suite.statistic.specs.total,
      pending: suite.statistic.specs.pending,
      disabled: suite.statistic.specs.pending,
      failures: that._getFailsInSpec(suite).length,
      time: suite.statistic.duration/1000
    };

    var testsuiteXml = {};

    testsuiteXml = that.xmlOutput.ele('testsuite', suiteDetails);
    suite.name = (that.instanceConfig.prefix || '')+suite.name+(that.instanceConfig.postfix || '');
    suite.specs.forEach(function(spec) {
      that._specAsXml(spec, suite.name, testsuiteXml);
    });
  });

  this.xmlOutput = this.xmlOutput.end({pretty: true, indent: '  '});
};

JasmineJUnitReporter.prototype._specAsXml = function(spec, suiteName, testsuiteXml) {
  var that = this;
  var specDetails = {
    classname: suiteName,
    name: spec.name,
    time: spec.statistic.duration/1000
  };
  var testcaseXml = {};

  var failedSpecDetails = {};
  if(that._isFailed(spec)) {
    testcaseXml = testsuiteXml.ele('testcase', specDetails);
    spec.expectations.forEach(function(expectation) {
      if(expectation.status === 'failed') {
        failedSpecDetails.matcher = expectation.matcher;
        failedSpecDetails.failureType = expectation.failureType || '';
        failedSpecDetails.message = expectation.message + ' '
          + JSON.stringify((expectation.details));
        failedSpecDetails.stack = expectation.stack
          || expectation.message;
        testcaseXml.ele('failure', failedSpecDetails);
      }
    });
  } else {
    testsuiteXml.ele('testcase', specDetails);
  }
};

JasmineJUnitReporter.prototype._isFailed = function(spec) {
  return spec.status.toLowerCase() == 'failed' ? true : false;
};

JasmineJUnitReporter.prototype._getFailsInSpec = function(suite) {
  var fails = [];
  suite.specs.forEach(function(spec) {
    if(spec.status == 'failed') {
      spec.expectations.forEach(function(expectation) {
        if(expectation.status == 'failed') {
          fails.push(spec.name);
        }
      });
    }
  });

  return fails;
};

JUnitReporter.prototype.register = function(jasmineEnv) {
  // create and attach the JUnit reporter
  jasmineEnv.addReporter(new JasmineJUnitReporter(this.config,this.instanceConfig,this.logger,this.collector));
};

module.exports = function(config,instanceConfig,logger,collector){
  return new JUnitReporter(config,instanceConfig,logger,collector);
};
