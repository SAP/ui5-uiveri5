
var fs = require('fs');
var mkdirp = require('mkdirp');

var DEFAULT_REPORT_NAME = 'target/report/report.json';

/**
 * @typedef JsonReporterConfig
 * @type {Object}
 * @extends {Config}
 */

/**
 * @typedef JsonReporterInstanceConfig
 * @type {Object}
 */

/**
 * Report test execution
 * @constructor
 * @param {JsonReporterConfig} config
 * @param {JsonReporterInstanceConfig} instanceConfig
 * @param {Logger} logger
 * @param {StatisticCollector} collector
 */
function JsonReporter(config,instanceConfig,logger,collector) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;
}

function JasmineJsonReporter(config,instanceConfig,logger,collector) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
  this.collector = collector;

  this.reportName = this.instanceConfig.reportName || DEFAULT_REPORT_NAME;
}

JasmineJsonReporter.prototype.jasmineStarted = function() {
  try {
    fs.statSync(this.reportName);
    try {
      fs.unlinkSync(this.reportName);
      this.logger.debug('Report: ' + this.reportName + ' is successfully deleted.');
    } catch (err) {
      this.logger.error('Error: ' + err.message + ' while deleting file: ' + this.reportName);
    }
  } catch (err) {
    //report not found, do nothing
  }
};

JasmineJsonReporter.prototype.suiteStarted = function() {
};

JasmineJsonReporter.prototype.specStarted = function() {
};

JasmineJsonReporter.prototype.specDone = function(spec) {
};

JasmineJsonReporter.prototype.suiteDone = function() {
};

JasmineJsonReporter.prototype.jasmineDone = function() {
  var overview = this.collector.getOverview();
  var jsonReport = JSON.stringify(overview);
  mkdirp.sync(this.reportName.substring(0,this.reportName.lastIndexOf('/')));
  fs.writeFileSync(this.reportName,jsonReport);
};

/**
 * Register jasmine reporter
 * @param {Env} jasmineEnv - jasmine environment on which to add the new reporter
 */
JsonReporter.prototype.register = function(jasmineEnv) {
  // create and attach our reporter
  jasmineEnv.addReporter(new JasmineJsonReporter(this.config,this.instanceConfig,this.logger,this.collector));
};

module.exports = function(config,instanceConfig,logger,collector){
  return new JsonReporter(config,instanceConfig,logger,collector);
};
