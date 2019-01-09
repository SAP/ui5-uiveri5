var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var utils = require('./reporterUtils');

var DEFAULT_SCREENSHOTS_ROOT = 'target/report/screenshots/';
var DEFAULT_TEMPLATE_NAME = __dirname + '/report.screenshots.tpl.html';
var DEFAULT_REPORT_NAME = 'report.html';

function JasmineScreenshotReporter(config, instanceConfig, logger, collector) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
  this.screenshotsRoot = instanceConfig.screenshotsRoot || DEFAULT_SCREENSHOTS_ROOT;
  this.templateName = instanceConfig.templateName || DEFAULT_TEMPLATE_NAME;
  this.reportName = path.join(this.screenshotsRoot, instanceConfig.reportName || DEFAULT_REPORT_NAME);
  this.stepIndex = 0;
}

JasmineScreenshotReporter.prototype.jasmineStarted = function () {
  utils.deleteReport(this.reportName, 'Screenshot');
};

JasmineScreenshotReporter.prototype.suiteStarted = function () {
};

JasmineScreenshotReporter.prototype.specStarted = function () {
  this.stepIndex = 0;
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

  // always save text info, but take screenshots only if option is set
  this._registerOnAction({actions: ['click', 'sendKeys']});
  this._registerOnExpectation();
};

JasmineScreenshotReporter.prototype._registerOnAction = function (options) {
  var that = this;

  // screenshot is taken between sync and interaction
  this._registerOnSync();

  options.actions.forEach(function (action) {
    var originalAction = protractorModule.parent.parent.exports.WebElement.prototype[action];

    protractorModule.parent.parent.exports.WebElement.prototype[action] = function () {
      var element = this;
      var actionValue = arguments[0];

      // TODO: save the locator which was used to find the element
      return element.getAttribute('id').then(function (elementId) {
        var onAction = that._onAction({
          element: element,
          elementId: elementId,
          name: action,
          value: actionValue
        });
        return originalAction.call(element, actionValue).then(onAction, onAction);
      });
    };
  });
};

JasmineScreenshotReporter.prototype._registerOnSync = function () {
  if (this._isEnabled('onAction')) {
    var that = this;
    var onSync = function () {
      return that._takeScreenshot(function (png) {
        that.lastSyncScreenshot = png;
      });
    };

    var originalWaitForAngular = browser.waitForAngular;
    browser.waitForAngular = function () {
      return originalWaitForAngular.apply(this, arguments).then(onSync, onSync);
    };
  }
};

JasmineScreenshotReporter.prototype._onAction = function (options) {
  var that = this;

  return function () {
    if (that._isEnabled('onAction') && that.lastSyncScreenshot) {
      var screenshotName = that._generateActionScreenshotName(options.name, options.elementId);
      that._saveScreenshot(screenshotName, that.lastSyncScreenshot);
      delete that.lastSyncScreenshot;
    }

    var action = _.extend(_.pick(options, ['name', 'elementId', 'value']), {
      stepIndex: that.stepIndex,
      screenshot: screenshotName
    });

    that.collector.collectAction(action);
    that.stepIndex += 1;
  };
};

// should be called after browser.getProcessedConfig()
JasmineScreenshotReporter.prototype._registerOnExpectation = function () {
  var that = this;
  var originalAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;

  jasmine.Spec.prototype.addExpectationResult = function (passed, expectation) {
    var specResult = this.result;
    var expectationCategory = passed ? 'passedExpectations' : 'failedExpectations';
    var expectationResult = originalAddExpectationResult.apply(this, arguments);

    function takeScreenshot () {
      var screenshotName = that._generateExpectationScreenshotName(specResult.fullName, passed);
      _.last(specResult[expectationCategory]).screenshot = screenshotName;
      that._takeScreenshot(function (png) {
        that._saveScreenshot(screenshotName, png);
      });
    }

    if (passed) {
      _.last(specResult[expectationCategory]).message = that._createExpectationMessage(expectation);

      if (that._isEnabled('onExpectSuccess')) {
        takeScreenshot();
      }
    } else {
      if (that._isEnabled('onExpectFailure') && (!passed || expectation.error)) {
        takeScreenshot();
      }
    }

    _.last(specResult[expectationCategory]).stepIndex = that.stepIndex;

    that.stepIndex += 1;

    return expectationResult;
  };
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
    this.stepIndex,
    (expectationPassed ? 'pass' : 'fail'),
    new Date().toISOString().substring(0, 19)
  ].join('_').replace(/[\/\?<>\\:\*\|":\s]/g, '-');

  return fileName + '.png';
};

JasmineScreenshotReporter.prototype._generateActionScreenshotName = function (action, elementId) {
  var fileName = [
    action,
    elementId.substring(0, 190),
    this.stepIndex,
    new Date().toISOString().substring(0, 19)
  ].join('_').replace(/[\/\?<>\\:\*\|":\s]/g, '-');

  return fileName + '.png';
};

JasmineScreenshotReporter.prototype._isEnabled = function (option) {
  return _.get(this.config, 'takeScreenshot.' + option);
};

JasmineScreenshotReporter.prototype._createExpectationMessage = function (expectation) {
  return ['Expected', '\'' + expectation.actual + '\'', expectation.matcherName, '\'' + expectation.expected + '\''].join(' ');
};

module.exports = function (config, instanceConfig, logger, collector) {
  return new JasmineScreenshotReporter(config, instanceConfig, logger, collector);
};
