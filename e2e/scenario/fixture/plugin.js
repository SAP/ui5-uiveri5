'use strict';

function TestPlugin(config, instanceConfig, logger){
  this.logger = logger;
}

TestPlugin.prototype.setup = function () {
  var logger = this.logger;
  browser.logger = logger; // expose to spec
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: setup');
      resolve();
    }, 1000);
  });
};

TestPlugin.prototype.onPrepare = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: onPrepare');
      resolve();
    }, 1000);
  });
};

TestPlugin.prototype.suiteStarted = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: suiteStarted');
      resolve();
    }, 1000);
  });
};

TestPlugin.prototype.specStarted = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: specStarted');
      resolve();
    }, 1000);
  });
};

TestPlugin.prototype.specDone = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: specDone');
      resolve();
    }, 1000);
  });
};

TestPlugin.prototype.suiteDone = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: suiteDone');
      resolve();
    }, 1000);
  });
};

TestPlugin.prototype.teardown = function () {
  var logger = this.logger;
  return new Promise(function (resolve) {
    setTimeout(function () {
      logger.info('Plugin: teardown');
      resolve();
    }, 1000);
  });
};

module.exports = function (config, instanceConfig, logger){
  return new TestPlugin(config, instanceConfig, logger);
};
