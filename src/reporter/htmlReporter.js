
var _ = require('lodash');
var fs = require('fs');
var utils = require('./reporterUtils');

var DEFAULT_TEMPLATE_NAME = __dirname + '/report.tpl.html';
var DEFAULT_REPORT_NAME = 'target/report/report.html';

/**
 * @typedef HtmlReporterConfig
 * @type {Object}
 * @extends {Config}
 */

/**
 * @typedef HtmlReporterInstanceConfig
 * @type {Object}
 */

/**
 * Report test execution
 * @constructor
 * @param {HtmlReporterConfig} config
 * @param {HtmlReporterInstanceConfig} instanceConfig
 * @param {Logger} logger
 * @param {StatisticCollector} collector
 */
function HtmlReporter(config,instanceConfig,logger,collector) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
}

function JasmineHtmlReporter(config,instanceConfig,logger,collector) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;

  this.templateName = this.instanceConfig.templateName || DEFAULT_TEMPLATE_NAME;
  this.reportName = this.instanceConfig.reportName || DEFAULT_REPORT_NAME;
}

JasmineHtmlReporter.prototype.jasmineStarted = function() {
  utils.deleteReport(this.reportName, 'HTML');
};

JasmineHtmlReporter.prototype.suiteStarted = function() {
};

JasmineHtmlReporter.prototype.specStarted = function() {
};

JasmineHtmlReporter.prototype.specDone = function() {
};

JasmineHtmlReporter.prototype.suiteDone = function() {
};

JasmineHtmlReporter.prototype.jasmineDone = function() {
  var overview = this.collector.getOverview();
  var template = fs.readFileSync(this.templateName, 'utf8');
  var htmlReport = _.template(template)(overview);
  utils.saveReport(this.reportName, htmlReport);
};

/**
 * Register jasmine reporter
 * @param {Env} jasmineEnv - jasmine environment on which to add the new reporter
 */
HtmlReporter.prototype.register = function(jasmineEnv) {
  // create and attach our reporter
  jasmineEnv.addReporter(new JasmineHtmlReporter(this.config,this.instanceConfig,this.logger,this.collector));
};

module.exports = function(config,instanceConfig,logger,collector){
  return new HtmlReporter(config,instanceConfig,logger,collector);
};
