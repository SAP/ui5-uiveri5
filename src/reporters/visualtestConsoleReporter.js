/**
 * @typedef ConsoleReporterConfig
 * @type {Object}
 * @extends {ReporterConfig}
 */

/**
 * Report test execution
 * @constructor
 * @param {Config} config - global config
 * @param {ConsoleReporterConfig} factoryConfig - instance config
 * @param {Logger} logger
 */
function VisualtestConsoleReporter(config,instanceConfig,logger) {
  this.config = config;
  this.instanceConfig = instanceConfig;
  this.logger = logger;
}

/**
 * Register jasmine reporter
 * @param {Env} jasmineEnv - jasmine environment on which to add the new reporter
 */
VisualtestConsoleReporter.prototype.register = function(jasmineEnv) {
  var visualtestConsoleReporter = function() {
    var totalSpecsDefined;
    var startTime;
    var started = false;
    var totalSpecsSkipped = 0;
    var totalSpecsFailed = 0;
    var totalSpecsDisabled = 0;
    var totalSpecsExecuted = 0;
    var currentSuite = {};
    var __specs = {};
    var __suites = {};
    var spec;
    var suite;
    var finished = false;
    this.failuresSummary = [];
    var that = this;

    function elapsed(start, end) { return (end - start)/1000; }
    function isFailed(obj) { return obj.status === "failed"; }
    function isSkipped(obj) { return obj.status === "pending"; }
    function isDisabled(obj) { return obj.status === "disabled"; }

    function extend(dupe, obj) { // performs a shallow copy of all props of `obj` onto `dupe`
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          dupe[prop] = obj[prop];
        }
      }
      return dupe;
    }

    function getSpec(spec) {
      __specs[spec.id] = extend(__specs[spec.id] || {}, spec);
      return __specs[spec.id];
    }

    function getSuite(suite) {
      __suites[suite.id] = extend(__suites[suite.id] || {}, suite);
      return __suites[suite.id];
    }

    that.jasmineStarted = function(suiteInfo) {
      totalSpecsDefined = suiteInfo.totalSpecsDefined;
      startTime = new Date();
      started = true;
    };

    that.suiteStarted = function(suite) {
      suite = getSuite(suite);
      suite._specs = 0;
      suite._nestedSpecs = 0;
      suite._failures = 0;
      suite._nestedFailures = 0;
      suite._skipped = 0;
      suite._nestedSkipped = 0;
      suite._disabled = 0;
      suite._nestedDisabled = 0;
      suite._parent = currentSuite;

      currentSuite = suite;
      console.log('Executing suite: ' + suite.description);
    };

    that.specStarted = function(result) {
      spec = getSpec(result);
      spec._suite = currentSuite;
      currentSuite._specs++;
    };

    that.specDone = function(result) {
      spec = getSpec(result);

      var failed = false;
      var skipped = false;
      var disabled = false;

      if(isSkipped(spec)) {
        skipped = true;
        spec._suite._skipped++;
        totalSpecsSkipped++;
      }

      if(isFailed(spec)) {
        failed = true;
        spec._suite._failures++;
        totalSpecsFailed++;
      }

      if(isDisabled(spec)) {
        disabled = true;
        spec._suite._disabled++;
        totalSpecsDisabled++;
      }

      totalSpecsExecuted++;

      console.log(' ' + spec.fullName);

      if(failed) {
        failuresSummary.push(spec.failedExpectations);
        spec.failedExpectations.forEach(function (failure) {
          if(failure.message.startsWith('{') && failure.message.endsWith('}')) {
            var messageJSON = JSON.parse(failure.message);
            var failureMessage = messageJSON.message;
            var failureDetail = messageJSON.detail;

            console.log('  -Failed: ' + failureMessage);
            console.log('  *Details: ' + failureDetail);
            console.log('     ' + failure.stack);
          } else {
            console.log('  -Failed: ' + failure.message);
            console.log('     ' + failure.stack);
          }
        });
      } else if(skipped) {
        console.log('  -Skipped');
      } else if(disabled) {
        console.log('  -Disabled');
      } else {
        console.log('  -Passed');
      }
    };
    that.suiteDone = function(result) {
      var currentSuite;
      suite = getSuite(result);
      if (suite._parent) {
        suite._parent._specs += suite._specs + suite._nestedSpecs;
        suite._parent._failures += suite._failures + suite._nestedFailures;
        suite._parent._skipped += suite._skipped + suite._nestedSkipped;
        suite._parent._disabled += suite._disabled + suite._nestedDisabled;

      }
      currentSuite = suite._parent;

      var total = suite._specs + suite._nestedSpecs;
      var failed = suite._failures + suite._nestedFailures;
      var skipped = suite._skipped + suite._nestedSkipped;
      var disabled = suite._disabled +suite._nestedDisabled;
      var passed = total - failed - skipped;

      console.log('Suite: ' + suite.fullName + ' is done.');
      console.log('Suite specs summary: ' + total + ', passed: ' + passed + ', failed: ' + failed);
    };
    that.jasmineDone = function() {
      var now = new Date();
      var dur = elapsed(startTime, now);
      var total = totalSpecsDefined || totalSpecsExecuted;
      var disabled = total - totalSpecsExecuted + totalSpecsDisabled;
      var skipped = totalSpecsSkipped;
      var spec_str = total + (total === 1 ? " spec, " : " specs, ");
      var fail_str = totalSpecsFailed + (totalSpecsFailed === 1 ? " failure, " : " failures, ");
      var skip_str = skipped + " skipped, ";
      var disabled_str = disabled + " disabled in ";
      var summary_str = spec_str + fail_str + skip_str + disabled_str + dur + "s.";
      var result_str = (totalSpecsFailed && "FAILURE: " || "SUCCESS: ") + summary_str;

      finished = true;

      console.log(result_str);
    };
    return that;
  };

  // create and attach our console reporter
  jasmineEnv.addReporter(visualtestConsoleReporter());
};

module.exports = function(config,instanceConfig,logger){
  return new VisualtestConsoleReporter(config,instanceConfig,logger);
};
