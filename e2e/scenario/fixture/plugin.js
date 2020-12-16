'use strict';

function TestPlugin(config, instanceConfig, logger) {
  this.logger = logger;
}

TestPlugin.prototype.setup = function () {
  var logger = this.logger;
  browser.logger = logger; // expose to spec
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: setup');
      resolve();
    }, 100);
  });
};

TestPlugin.prototype.onPrepare = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: onPrepare');
      resolve();
    }, 100);
  });
};

TestPlugin.prototype.suiteStarted = function (suite) {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: suiteStarted: ${name}', suite);
      resolve();
    }, 100);
  });
};

TestPlugin.prototype.specStarted = function (spec) {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: specStarted: ${name}', spec);
      resolve();
    }, 100);
  });
};

TestPlugin.prototype.specDone = function (spec) {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: specDone: ${name}', spec);
      resolve();
    }, 100);
  });
};

TestPlugin.prototype.suiteDone = function (suite) {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: suiteDone: ${name}', suite);
      resolve();
    }, 100);
  });
};

TestPlugin.prototype.teardown = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: teardown');
      resolve();
    }, 100);
  });
};

module.exports = function (config, instanceConfig, logger) {
  return new TestPlugin(config, instanceConfig, logger);
};
