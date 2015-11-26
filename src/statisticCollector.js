
/**
 * @typedef Overview
 * @type {Object}
 * @property {[Suite]} suites
 * @property {(passed|failed)} status - failed if at least one suite failed
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

  // @type Overview
  this.overview = {
    suites: [],
    statistic: {}
  };

  this.currentSuite = null;
  this.currentSpec = null;
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

StatisticCollector.prototype.specStarted = function(jasmineSpec){
  this.currentSpec = {
    name: jasmineSpec.fullName,
    statistic: {
      duration: new Date()  // save start time in duration during the run
    }
  };
};

StatisticCollector.prototype.specDone = function(jasmineSpec) {
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
      stack: jasmineExpectation.stack
    };

    // unpack details if any
    var message = jasmineExpectation.message;
   if (message.indexOf('{') === 0 && message.lastIndexOf('}')+1 === message.length) {
      var messageJSON = JSON.parse(message);
      expectation.message = messageJSON.message;
      expectation.details = messageJSON.details;
    } else {
      expectation.message = message;
    }

    this.currentSpec.expectations.push(expectation);

    // count image comparison failures
    if(jasmineExpectation.matcherName === 'toLookAs'){
      failedWithImageCount++;
    }
  },this);

  // process passed expectations
  jasmineSpec.passedExpectations.forEach(function (jasmineExpectation) {
    expectation = {
      status: 'passed',
      matcher: jasmineExpectation.matcherName
    };

    this.currentSpec.expectations.push(expectation);
  },this);

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

StatisticCollector.prototype.suiteDone = function(){
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

StatisticCollector.prototype.jasmineDone = function(){
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
  }
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

module.exports = function(){
  return new StatisticCollector();
};
