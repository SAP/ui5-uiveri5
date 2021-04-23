var statisticCollector = require('../statisticCollector');

module.exports = {
  register: function () {
    jasmine.getEnv().addReporter({
      jasmineStarted: function () {
        statisticCollector.jasmineStarted();
      },
      suiteStarted: function (jasmineSuite) {
        statisticCollector.suiteStarted(jasmineSuite);
      },
      specStarted: function (jasmineSpec) {
        statisticCollector.specStarted(jasmineSpec);
      },
      specDone: function (jasmineSpec) {
        statisticCollector.specDone(jasmineSpec, browser.testrunner.currentSpec._meta);
        delete browser.testrunner.currentSpec._meta;
      },
      suiteDone: function (jasmineSuite) {
        statisticCollector.suiteDone(jasmineSuite, browser.testrunner.currentSuite._meta);
        delete browser.testrunner.currentSuite._meta;
      },
      jasmineDone: function () {
        statisticCollector.jasmineDone({
          runtime: browser.testrunner.runtime
        });
      }
    });

  }
};
