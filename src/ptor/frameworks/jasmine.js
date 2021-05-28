var q = require('q');
var webdriver = require('selenium-webdriver');
var RunnerReporter = require('../../coreReporters/runnerReporter');

/**
 * Execute the Runner's test cases through Jasmine.
 *
 * @param {Runner} runner The current test Runner.
 * @param {Array} specs Array of Directory Path Strings.
 * @return {q.Promise} Promise resolved with the test results
 */
module.exports.run = function(runner, specs) {
  var JasmineRunner = require('jasmine');
  var jrunner = new JasmineRunner();
  /* global jasmine */

  require('jasminewd2').init(webdriver.promise.controlFlow(), webdriver);

  var jasmineNodeOpts = runner.getConfig().jasmineNodeOpts;

  // On timeout, the flow should be reset. This will prevent webdriver tasks
  // from overflowing into the next test and causing it to fail or timeout
  // as well. This is done in the reporter instead of an afterEach block
  // to ensure that it runs after any afterEach() blocks with webdriver tasks
  // get to complete first.
  var reporter = new RunnerReporter(runner);
  reporter.register();

  // Filter specs to run based on jasmineNodeOpts.grep and jasmineNodeOpts.invert.
  jasmine.getEnv().specFilter = function(spec) {
    var grepMatch = !jasmineNodeOpts ||
        !jasmineNodeOpts.grep ||
        spec.getFullName().match(new RegExp(jasmineNodeOpts.grep)) != null;
    var invertGrep = !!(jasmineNodeOpts && jasmineNodeOpts.invertGrep);
    if (grepMatch == invertGrep) {
      spec.disable();
    }
    return true;
  };

  return runner.runTestPreparer().then(function() {
    return q.promise(function(resolve, reject) {
      if (jasmineNodeOpts && jasmineNodeOpts.defaultTimeoutInterval) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineNodeOpts.defaultTimeoutInterval;
      }

      var originalOnComplete = runner.getConfig().onComplete;

      jrunner.onComplete(function(passed) {
        try {
          var completed = q();
          if (originalOnComplete) {
            completed = q(originalOnComplete(passed));
          }
          completed.then(function() {
            resolve({
              failedCount: reporter.failedCount,
              specResults: reporter.testResult
            });
          });
        } catch (err) {
          reject(err);
        }
      });

      jrunner.configureDefaultReporter(jasmineNodeOpts);
      jrunner.projectBaseDir = '';
      jrunner.specDir = '';
      jrunner.addSpecFiles(specs);
      jrunner.execute();
    });
  });
};
