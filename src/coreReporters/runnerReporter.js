var RunnerReporter = function (emitter) {
  this.emitter = emitter;
  this.testResult = [];
  this.failedCount = 0;
};

RunnerReporter.prototype.register = function () {
  jasmine.getEnv().addReporter(this);
};

RunnerReporter.prototype.jasmineStarted = function () {
  // Need to initiate startTime here, in case reportSpecStarting is not
  // called (e.g. when fit is used)
  this.startTime = new Date();
};

RunnerReporter.prototype.specStarted = function () {
  this.startTime = new Date();
};

RunnerReporter.prototype.specDone = function (result) {
  var specInfo = {
    name: result.description,
    category: result.fullName.slice(0, -result.description.length).trim()
  };
  if (result.status == 'passed') {
    this.emitter.emit('testPass', specInfo);
  } else if (result.status == 'failed') {
    this.emitter.emit('testFail', specInfo);
    this.failedCount++;
  }

  var entry = {
    description: result.fullName,
    assertions: [],
    duration: new Date().getTime() - this.startTime.getTime()
  };

  if (result.failedExpectations.length === 0) {
    entry.assertions.push({
      passed: true
    });
  }

  result.failedExpectations.forEach(function (item) {
    entry.assertions.push({
      passed: item.passed,
      errorMsg: item.passed ? undefined : item.message,
      stackTrace: item.passed ? undefined : item.stack
    });
  });
  this.testResult.push(entry);
};

module.exports = RunnerReporter;

