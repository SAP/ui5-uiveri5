
/**
 * @typedef ConsoleReporterConfig
 * @type {Object}
 * @extends {Config}
 */

/**
 * @typedef ConsoleReporterInstanceConfig
 * @type {Object}
 */

/**
 * Report test execution
 * @constructor
 * @param {ConsoleReporterConfig} config
 * @param {ConsoleReporterInstanceConfig} instanceConfig
 * @param {Logger} logger
 */
function ConsoleReporter(config,instanceConfig,logger) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
}

function JasmineConsoleReporter(logger) {
  this.logger = logger;

  // suites statistic
  this.suiteTotal = 0;
  this.suiteFailed = 0;

  // initial suite will accumulate specs statistic
  this.currentSuite = {
    _startTime : 0,
    _specTotal: 0,
    _specFailed: 0,
    _specPending: 0,
    _specDisabled: 0,
    _expectPassed: 0,
    _expectFailedError: 0,
    _expectFailedImage: 0
  };
}

JasmineConsoleReporter._elapsed = function elapsed(start, end) {
  return (end - start)/1000;
};

JasmineConsoleReporter.prototype.jasmineStarted = function() {
  this.currentSuite._startTime = new Date();
};

JasmineConsoleReporter.prototype.suiteStarted = function(suite) {
  suite._startTime =  new Date();
  suite._specTotal = 0;
  suite._specFailed = 0;
  suite._specPending = 0;
  suite._specDisabled = 0;
  suite._expectPassed = 0;
  suite._expectFailedError = 0;
  suite._expectFailedImage = 0;
  suite._parent = this.currentSuite;
  this.currentSuite = suite;

  this.suiteTotal++;

  this.logger.info('Suite started: ' + suite.description);
};

JasmineConsoleReporter.prototype.specStarted = function(spec) {
  this.logger.info('Spec started: ' + spec.fullName);

  this.currentSuite._specTotal++;
};

JasmineConsoleReporter.prototype.specDone = function(spec) {

  if(spec.status === "failed") {
    spec.failedExpectations.forEach(function (failure) {
      var message = failure.message;
      if(message.indexOf('{') === 0 && message.indexOf('}')+1 === message.length ) {
        var messageJSON = JSON.parse(message);
        var failureMessage = messageJSON.message;
        var failureDetail = messageJSON.detail;

        this.logger.info('Expectation FAILED: ' + failureMessage);
        this.logger.info('Expectation FAILED details: ' + failureDetail);

      } else {
        this.logger.info('Expectation FAILED: ' + message);
      }
      this.logger.debug('Expectation FAILED stack: ${stack}',{stack: failure.stack});

      // update expectations statistic
      if(failure.matcherName === 'toLookAs'){
        this.currentSuite._expectFailedImage++;
      } else {
        this.currentSuite._expectFailedError++;
      }
    },this);

    // update specs statistic
    this.currentSuite._specFailed++;

    this.logger.info('Spec finished: FAILED');
  }else if(spec.status === 'pending') {
    // update specs statistic
    this.currentSuite._specPending++;

    this.logger.info('Spec finished: PENDING');
  } else if(spec.status === 'disabled'){
    // update specs statistic
    this.currentSuite._specDisabled++;

    this.logger.info('Spec finished: DISABLED');
  } else {
    // passed specs are not counted explicitly, will be computed

    // passed expectations need to be stored explicitly as there is no startExpectation hook
    this.currentSuite._expectPassed = spec.passedExpectations.length;
  }
};

JasmineConsoleReporter.prototype.suiteDone = function(suite) {
  // compute specs statistic in parent
  suite._parent._specTotal += suite._specTotal;
  suite._parent._specFailed += suite._specFailed;
  suite._parent._specPending += suite._specPending;
  suite._parent._specDisabled += suite._specDisabled;
  suite._parent._expectPassed += suite._expectPassed;
  suite._parent._expectFailedError += suite._expectFailedError;
  suite._parent._expectFailedImage += suite._expectFailedImage;
  this.currentSuite = suite._parent;

  // update suites statistic
  if (suite._specFailed > 0) {
    this.suiteFailed++;
  }

  // compute display statistic
  var suiteDuration = JasmineConsoleReporter._elapsed(suite._startTime,new Date());
  var specPassed = suite._specTotal - suite._specFailed - suite._specPending - suite._specDisabled;
  var expectTotal = suite._expectPassed + suite._expectFailedError + suite._expectFailedImage;

  this.logger.info('Suite finished: ' + suite.fullName + ' with status: ' + (suite._specFailed > 0 ? 'FAILED' : 'SUCCEED') +
  ' for: ' + suiteDuration + 's');
  this.logger.info('Suite specs summary' +
  ', total: ' + suite._specTotal + ', passed: ' + specPassed + ', failed: ' + suite._specFailed +
  ', pending: ' + suite._specPending + ', disabled: ' + suite._specDisabled);
  this.logger.info('Suite expectations summary' +
  ', total: ' + expectTotal + ', passed: ' + suite._expectPassed + ', failed with error: ' + suite._expectFailedError +
  ', failed with image comparison: ' + suite._expectFailedImage);
};

JasmineConsoleReporter.prototype.jasmineDone = function() {
  var overallDuration = JasmineConsoleReporter._elapsed(this.currentSuite._startTime,new Date());
  var suitePassed = this.suiteTotal - this.suiteFailed;
  var specPassed = this.currentSuite._specTotal - this.currentSuite._specFailed - this.currentSuite._specPending - this.currentSuite._specDisabled;
  var expectTotal = this.currentSuite._expectPassed + this.currentSuite._expectFailedError + this.currentSuite._expectFailedImage;

  this.logger.info('Overall status: ' + (this.currentSuite._specFailed > 0 ? 'FAILED' : 'SUCCEED') +
  ' for: ' + overallDuration + 's');
  this.logger.info('Overall suites summary:' +
  ', total: ' + this.suiteTotal + ', passed: ' + suitePassed + ', failed: ' + this.suiteFailed);
  this.logger.info('Overall specs summary' +
  ', total: ' + this.currentSuite._specTotal + ', passed: ' + specPassed + ', failed: ' + this.currentSuite._specFailed +
  ', pending: ' + this.currentSuite._specPending + ', disabled: ' + this.currentSuite._specDisabled);
  this.logger.info('Overall expectations summary' +
  ', total: ' + expectTotal + ', passed: ' + this.currentSuite._expectPassed + ', failed with error: ' + this.currentSuite._expectFailedError +
  ', failed with image comparison: ' + this.currentSuite._expectFailedImage);
};

/**
 * Register jasmine reporter
 * @param {Env} jasmineEnv - jasmine environment on which to add the new reporter
 */
ConsoleReporter.prototype.register = function(jasmineEnv) {
  // create and attach our console reporter
  jasmineEnv.addReporter(new JasmineConsoleReporter(this.logger));
};

module.exports = function(config,instanceConfig,logger){
  return new ConsoleReporter(config,instanceConfig,logger);
};
