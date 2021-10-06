var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var utils = require('./reporterUtils');
var crypto = require('crypto');

var DEFAULT_SCREENSHOTS_ROOT = 'target/report/screenshots/';
var DEFAULT_TEMPLATE_NAME = __dirname + '/report.screenshots.tpl.html';
var DEFAULT_REPORT_NAME = 'report.html';

function JasmineScreenshotReporter(config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
  this.actionInterceptor = actionInterceptor;
  this.expectationInterceptor = expectationInterceptor;
  this.screenshotsRoot = instanceConfig.screenshotsRoot || DEFAULT_SCREENSHOTS_ROOT;
  this.templateName = instanceConfig.templateName || DEFAULT_TEMPLATE_NAME;
  this.reportName = path.join(this.screenshotsRoot, instanceConfig.reportName || DEFAULT_REPORT_NAME);
}

JasmineScreenshotReporter.prototype.jasmineStarted = function () {
  utils.deleteReport(this.reportName, 'Screenshot');
};

JasmineScreenshotReporter.prototype.suiteStarted = function () {
};

JasmineScreenshotReporter.prototype.specStarted = function () {
};

JasmineScreenshotReporter.prototype.specDone = function () {
};

JasmineScreenshotReporter.prototype.suiteDone = function () {
};

JasmineScreenshotReporter.prototype.jasmineDone = function () {
  var overview = this.collector.getOverview();
  var template = fs.readFileSync(this.templateName, 'utf8');
  var htmlReport = _.template(template)(overview);
  utils.saveReport(this.reportName, htmlReport);
};

JasmineScreenshotReporter.prototype.register = function (jasmineEnv) {
  jasmineEnv.addReporter(this);
  var that = this;

  this.expectationInterceptor.onExpectation(this._onExpectation.bind(this));
  this.actionInterceptor.onSync(function () {
    // screenshot is taken between sync and interaction
    return that._takeScreenshot(function (png) {
      that.lastSyncScreenshot = png;
    });
  });
  this.actionInterceptor.onAction(that._onAction.bind(this));
};

JasmineScreenshotReporter.prototype._onExpectation = function (expectation, specResult, category) {
  var that = this;

  if ((that._isEnabled('onExpectSuccess') && expectation.passed) || (that._isEnabled('onExpectFailure') && !expectation.passed)) {
    var screenshotName = that._generateExpectationScreenshotName(specResult.fullName, expectation.passed);
    _.last(specResult[category]).screenshot = screenshotName;
    that._takeScreenshot(function (png) {
      that._saveScreenshot(screenshotName, png);
    });
  }

  _.last(specResult[category]).shortMessage = ['Expected', '\'' + expectation.actual + '\'', expectation.matcherName, '\'' + expectation.expected + '\''].join(' ');
  _.last(specResult[category]).stepIndex = this.collector.stepIndex;
  this.collector.stepIndex += 1;
};

JasmineScreenshotReporter.prototype._onAction = function (action) {
  if (this._isEnabled('onAction') && this.lastSyncScreenshot) {
    var screenshotName = this._generateActionScreenshotName(action.name, action.elementId);
    this._saveScreenshot(screenshotName, this.lastSyncScreenshot);
    delete this.lastSyncScreenshot;
  }

  // add action to the statistic for the current spec
  this.collector.collectAction(_.extend(_.pick(action, ['name', 'elementLocator', 'elementId', 'value']), {
    screenshot: screenshotName
  }));
};

JasmineScreenshotReporter.prototype._takeScreenshot = function (successCallback) {
  var that = this;
  return browser.takeScreenshot().then(successCallback, function (err) {
    that.logger.error('Error while taking report screenshot: ' + err);
  });
};

JasmineScreenshotReporter.prototype._saveScreenshot = function (name, data) {
  if (data) {
    utils.createDir(this.screenshotsRoot);
    var screenshotPath = path.join(this.screenshotsRoot, name);
    fs.writeFileSync(screenshotPath, new Buffer(data, 'base64'));
    this.logger.debug('Screenshot created "' + screenshotPath + '"');
  }
};

JasmineScreenshotReporter.prototype._generateExpectationScreenshotName = function (specFullName, expectationPassed) {
  var fileName = [
    specFullName.substring(0, 220),
    this.collector.stepIndex,
    (expectationPassed ? 'pass' : 'fail'),
    new Date().toISOString().substring(0, 19)
  ].join('_').replace(/[\/\?<>\\:\*\|":\s]/g, '-');

  return fileName + '.png';
};

JasmineScreenshotReporter.prototype._generateActionScreenshotName = function (action, elementId) {
  var fileName = [
    action,
    elementId ? elementId.substring(0, 190) : crypto.randomBytes(16).toString('hex'),
    this.collector.stepIndex,
    new Date().toISOString().substring(0, 19)
  ].join('_').replace(/[\/\?<>\\:\*\|":\s]/g, '-');

  return fileName + '.png';
};

JasmineScreenshotReporter.prototype._isEnabled = function (option) {
  return _.get(this.config, 'takeScreenshot.' + option);
};

module.exports = function (config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor) {
  return new JasmineScreenshotReporter(config, instanceConfig, logger, collector, actionInterceptor, expectationInterceptor);
};
