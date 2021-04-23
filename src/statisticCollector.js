
/**
 * @typedef Overview
 * @type {Object}
 * @property {[Suite]} suites
 * @property {(passed|failed)} status - failed if at least one suite failed
 * @property {Object} mata - execution metadata
 * @property {Runtime} meta.runtime - runtime
 * @property {Object} statistic
 * @property {number} statistic.duration - duration in ms
 * @property {SuitesStatistic} statistic.suites
 * @property {SpecsStatistic} statistic.specs
 * @property {ExpectationsStatistic} statistic.expectations
 */

/**
 * @typedef Suite
 * @type {Object}
 * @property {string} name
 * @property {(passed|failed)} status - failed if at least one spec failed
 * @property {[Specs]} specs
 * @property {Object} meta - suite metadata
 * @property {string} meta.controlName - override control name
 * @property {Object} statistic
 * @property {number} statistic.duration - duration in ms
 * @property {SpecsStatistic} statistic.specs
 * @property {ExpectationsStatistic} statistics.expectations
 */

/**
 * @typedef Spec
 * @type {Object}
 * @property {string} name
 * @property {(passed|failed|pending|disabled)} status
 * @property {[Expectation]} expectations
 * @property {Object} meta - spec metadata
 * @property {Object} statistic
 * @property {number} statistic.duration - duration in ms
 * @property {ExpectationsStatistic} statistic.expectations
 */

/**
 * @typedef Expectation
 * @type {Object}
 * @property {(passed|failed)} status
 * @property {string} matcher - matcher name like toLookAs,toBe
 * @property {ExpectationDetails} details
 * @property {string} message
 * @property {string} imageName
 * @property {string} stack
 */

/**
 * @type ExpectationDetails
 * @property {string} actImageUrl
 * @property {string} refImageUrl
 * @property {string} diffImageUrl
 */

/**
 * @typedef SuitesStatistic
 * @type {Object}
 * @property {number} total
 * @property {number} failed
 * @property {number} passed
 */

/**
 * @typedef SpecsStatistic
 * @type {Object}
 * @property {number} total
 * @property {number} failed
 * @property {number} passed
 * @property {number} pending
 * @property {number} disabled
 */

/**
 * @typedef ExpectationsStatistic
 * @type {Object}
 * @property {number} total
 * @property {Object} failed
 * @property {string} failed.total
 * @property {string} failed.error
 * @property {string} failed.image
 * @property {number} passed
 */

/**
 * Stateful statistic collector
 * @constructor
 */
function StatisticCollector(){

  this.reset();

  this.currentSuite = null;
  this.currentSpec = null;
  this._authStartedCallbacks = [];
  this._authDoneCallbacks = [];
  this.stepIndex = 0;
}

StatisticCollector.prototype.jasmineStarted = function(){
  this.overview.statistic.duration = new Date();  // save start time in duration during the run
};

StatisticCollector.prototype.suiteStarted = function(jasmineSuite){
  this.currentSuite = {
    name: jasmineSuite.description,
    specs: [],
    statistic: {
      duration: new Date()  // save start time in duration during the run
    }
  };
};

StatisticCollector.prototype.specStarted = function(jasmineSpec, specMeta){
  this.stepIndex = 0;
  this.currentSpec = {
    // save the description as spec name instead of fullName, which includes the suite name too
    name: jasmineSpec.description,
    statistic: {
      duration: new Date()  // save start time in duration during the run
    },
    actions: [],
    stepSequence: [],
    logs: []
  };
  if (specMeta) {
    this.currentSpec.meta = specMeta;
  }
};

StatisticCollector.prototype.specDone = function(jasmineSpec, specMeta) {
  // compute duration
  this.currentSpec.statistic.duration = new Date() - this.currentSpec.statistic.duration;

  // process status
  this.currentSpec.status = jasmineSpec.status;

  // process expectations
  this.currentSpec.expectations = [];
  var expectation;

  // process failed expectations
  var failedWithImageCount = 0;
  jasmineSpec.failedExpectations.forEach(function (jasmineExpectation) {
    expectation = {
      status: 'failed',
      matcher: jasmineExpectation.matcherName,
      stack: jasmineExpectation.stack,
      stepIndex: jasmineExpectation.stepIndex,
      screenshot: jasmineExpectation.screenshot,
      shortMessage: jasmineExpectation.shortMessage,
      fullMessage: jasmineExpectation.fullMessage
    };

    // unpack details if any
    var message = jasmineExpectation.message;
    var timeoutMsg = 'Timeout waiting to synchronize with UI5';
    if (new RegExp(timeoutMsg).test(message)) {
      // for INFO logs show only the message
      expectation.message = timeoutMsg;
      // for DEBUG logs show formatted details
      var timeoutDetailsRegExp = new RegExp(timeoutMsg + '.+?(?=")');
      expectation.stack = JSON.parse('"' + timeoutDetailsRegExp.exec(message)[0] + '"');
    } else if (message.indexOf('{') === 0 && message.lastIndexOf('}')+1 === message.length) {
      var messageJSON = JSON.parse(message);
      expectation.message = messageJSON.message;
      expectation.details = messageJSON.details;
      expectation.imageName = messageJSON.imageName;
      expectation.failureType = messageJSON.failureType;
    } else {
      expectation.message = message;
    }

    this.currentSpec.expectations.push(expectation);

    // count image comparison failures
    if(expectation.failureType === 'COMPARISON'){
      failedWithImageCount++;
    }

    this.currentSpec.stepSequence[expectation.stepIndex] = 'expectations';
  },this);

  // process passed expectations
  jasmineSpec.passedExpectations.forEach(function (jasmineExpectation) {
    expectation = {
      status: 'passed',
      matcher: jasmineExpectation.matcherName,
      stepIndex: jasmineExpectation.stepIndex,
      screenshot: jasmineExpectation.screenshot,
      message: jasmineExpectation.message,
      shortMessage: jasmineExpectation.shortMessage,
      fullMessage: jasmineExpectation.fullMessage
    };

    // unpack details if any
    if (jasmineExpectation.passed && typeof jasmineExpectation.passed == 'object' &&
      jasmineExpectation.passed.message) {
      var message = jasmineExpectation.passed.message;
      if (message.indexOf('{') === 0 && message.lastIndexOf('}')+1 === message.length) {
        var messageJSON = JSON.parse(message);
        expectation.message = messageJSON.message;
        expectation.details = messageJSON.details;
        expectation.imageName = messageJSON.imageName;
      } else {
        expectation.message = message;
      }
    }

    this.currentSpec.expectations.push(expectation);

    this.currentSpec.stepSequence[expectation.stepIndex] = 'expectations';
  },this);

  if (specMeta) {
    this.currentSpec.meta = Object.assign(this.currentSpec.meta || {}, specMeta);
  }

  // compute expectations statistic
  this.currentSpec.statistic.expectations = {
    total: jasmineSpec.failedExpectations.length + jasmineSpec.passedExpectations.length,
    failed: {
      total: jasmineSpec.failedExpectations.length,
      error: jasmineSpec.failedExpectations.length - failedWithImageCount,
      image: failedWithImageCount
    },
    passed: jasmineSpec.passedExpectations.length
  };

  this.currentSuite.specs.push(this.currentSpec);
};

StatisticCollector.prototype.suiteDone = function(jasmineSuite, suiteMeta){
  // compute duration
  this.currentSuite.statistic.duration = new Date() - this.currentSuite.statistic.duration;

  // compute statistic
  var failedSpecCount = 0;
  var pendingSpecCount = 0;
  var disabledSpecCount = 0;
  var failedWithErrorExpectationsCount = 0;
  var failedWithImageExpectationsCount = 0;
  var passedExpectationsCount = 0;
  this.currentSuite.specs.forEach(function(spec){
    if(spec.status === 'failed'){
      failedSpecCount++;
    } else if (spec.status === 'pending'){
      pendingSpecCount++;
    } else if (spec.status === 'disabled'){
      disabledSpecCount++;
    }
    failedWithErrorExpectationsCount += spec.statistic.expectations.failed.error;
    failedWithImageExpectationsCount += spec.statistic.expectations.failed.image;
    passedExpectationsCount += spec.statistic.expectations.passed;
  });

  // compute status
  if ( failedSpecCount > 0){
    this.currentSuite.status = 'failed';
  } else {
    this.currentSuite.status = 'passed';
  }

  if (suiteMeta) {
    this.currentSuite.meta = suiteMeta;
  }

  // prepare specs statistic
  this.currentSuite.statistic.specs = {
    total: this.currentSuite.specs.length,
    failed: failedSpecCount,
    passed: this.currentSuite.specs.length - failedSpecCount - pendingSpecCount - disabledSpecCount,
    pending: pendingSpecCount,
    disabled: disabledSpecCount
  };

  // prepare expectations statistic
  this.currentSuite.statistic.expectations = {
    total: failedWithErrorExpectationsCount + failedWithImageExpectationsCount + passedExpectationsCount,
    failed: {
      total: failedWithErrorExpectationsCount + failedWithImageExpectationsCount,
      error: failedWithErrorExpectationsCount,
      image: failedWithImageExpectationsCount
    },
    passed: passedExpectationsCount
  };

  this.overview.suites.push(this.currentSuite);
};

StatisticCollector.prototype.jasmineDone = function(runMeta){
  // compute duration
  this.overview.statistic.duration = new Date() - this.overview.statistic.duration;

  // compute statistic
  var failedSuitesCount = 0;
  var failedSpecsCount = 0;
  var passedSpecsCount = 0;
  var pendingSpecCount = 0;
  var disabledSpecCount = 0;
  var failedWithErrorExpectationsCount = 0;
  var failedWithImageExpectationsCount = 0;
  var passedExpectationsCount = 0;
  this.overview.suites.forEach(function(suite){
    if (suite.status === 'failed'){
      failedSuitesCount++;
    }
    failedSpecsCount += suite.statistic.specs.failed;
    passedSpecsCount += suite.statistic.specs.passed;
    pendingSpecCount += suite.statistic.specs.pending;
    disabledSpecCount += suite.statistic.specs.disabled;

    failedWithErrorExpectationsCount += suite.statistic.expectations.failed.error;
    failedWithImageExpectationsCount += suite.statistic.expectations.failed.image;
    passedExpectationsCount += suite.statistic.expectations.passed;
  });

  // compute status
  if ( failedSuitesCount > 0){
    this.overview.status = 'failed';
  } else {
    this.overview.status = 'passed';
  }

  if (runMeta) {
    this.overview.meta = runMeta;
  }

  // prepare suites statistic
  this.overview.statistic.suites = {
    total: this.overview.suites.length,
    failed: failedSuitesCount,
    passed: this.overview.suites.length - failedSuitesCount
  };

  // prepare specs statistic
  this.overview.statistic.specs = {
    total: failedSpecsCount + passedSpecsCount + pendingSpecCount + disabledSpecCount,
    failed: failedSpecsCount,
    passed: passedSpecsCount,
    pending: pendingSpecCount,
    disabled: disabledSpecCount
  };

  // prepare expectations statistic
  this.overview.statistic.expectations = {
    total: failedWithErrorExpectationsCount + failedWithImageExpectationsCount + passedExpectationsCount,
    failed: {
      total: failedWithErrorExpectationsCount + failedWithImageExpectationsCount,
      error: failedWithErrorExpectationsCount,
      image: failedWithImageExpectationsCount
    },
    passed: passedExpectationsCount
  };
};

// starts mock spec consisting of authentication steps.
// solves the issue that sometimes (like when there is a beforeAll block)
// the authentication starts before the first spec is detected by jasmine
StatisticCollector.prototype.authStarted = function () {
  // normally authentication is started after the first spec is started.
  // in this case, since authStarted changes the currentSpec, we lose information about the first spec in the suite.
  // preserve the first spec before continuing with authentication
  this.specStartedBeforeAuth = this.currentSpec;
  this.specStarted({
    description: 'Authentication'
  }, {
    isAuthentication: true
  });
  this._authStartedCallbacks.forEach(function (cb) {
    cb();
  });
};

// completes mock spec consisting of authentication steps
StatisticCollector.prototype.authDone = function () {
  this.specDone({
    status: 'passed',
    failedExpectations: [],
    passedExpectations: []
  }, {
    isAuthentication: true
  });

  // restore the information about the first spec in the suite
  this.currentSpec = this.specStartedBeforeAuth;
  this._authDoneCallbacks.forEach(function (cb) {
    cb();
  });
};

StatisticCollector.prototype.isAuthInProgress = function () {
  return this.currentSpec.meta && this.currentSpec.meta.isAuthentication;
};

StatisticCollector.prototype.onAuthStarted = function (cb) {
  this._authStartedCallbacks.push(cb);
};

StatisticCollector.prototype.onAuthDone = function (cb) {
  this._authDoneCallbacks.push(cb);
};

StatisticCollector.prototype.collectAction = function (action) {
  // don't collect actions outside of a jasmine spec;
  // e.g. if you are using sendKeys in beforeEach, the currentSpec will be undefined
  if (!this.currentSpec) {
    return;
  }
  if (this.isAuthInProgress()) {
    // hide authentication values
    delete action.value;
  }
  if (action.stepIndex === undefined) {
    this.currentSpec.actions.push(Object.assign(action, {
      stepIndex: this.stepIndex
    }));
    this.currentSpec.stepSequence[this.stepIndex] = 'actions';
    this.stepIndex += 1;
  } else {
    this.currentSpec.actions.push(action);
    this.currentSpec.stepSequence[action.stepIndex] = 'actions';
  }
};

StatisticCollector.prototype.collectLog = function (sLog) {
  this.currentSpec.logs.push({
    text: sLog,
    stepIndex: this.stepIndex
  });
};

/**
 * Return overview
 * @returns {Overview}
 */
StatisticCollector.prototype.getOverview = function(){
  return this.overview;
};

/**
 * Return current spec
 * @returns {Spec}
 */
StatisticCollector.prototype.getCurrentSpec = function(){
  return this.currentSpec;
};

/**
 * Return current suite
 * @returns {Suite}
 */
StatisticCollector.prototype.getCurrentSuite = function(){
  return this.currentSuite;
};

StatisticCollector.prototype.reset = function () {
  // @type Overview
  this.overview = {
    suites: [],
    statistic: {}
  };
};

module.exports = new StatisticCollector();
