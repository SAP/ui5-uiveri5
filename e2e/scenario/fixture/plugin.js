'use strict';


function TestPlugin(config,instanceConfig,logger){
  //this.config  = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;
}

TestPlugin.prototype.setup = function() {
    this.logger.info('Plugin: setup');
};

TestPlugin.prototype.onPrepare = function() {
    this.logger.info('Plugin: onPrepare');
};

TestPlugin.prototype.suiteStarted = function(suite) {
    this.logger.info('Plugin: suiteStarted: ${name}',suite);
};

TestPlugin.prototype.specStarted = function(spec) {
    this.logger.info('Plugin: specStarted: ${name}',spec);
};

TestPlugin.prototype.specDone = function(spec) {
    this.logger.info('Plugin: specDone: ${name}',spec);
};

TestPlugin.prototype.suiteDone = function(suite) {
    this.logger.info('Plugin: suiteDone: ${name}',suite);
};

TestPlugin.prototype.teardown = function() {
    this.logger.info('Plugin: teardown');
};

module.exports = function(config,instanceConfig,logger){
  return new TestPlugin(config,instanceConfig,logger);
};
