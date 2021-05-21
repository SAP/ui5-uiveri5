// file will be executed by Runner as onPrepare

var logger = require('./logger');
var plugins = require('./plugins/plugins');
var pageObjectFactory = require('./pageObjectFactory');

// config is the test Runner's config
module.exports = function (config) {

  browser.controlFlow().execute(function () {
    var moduleLoader = require('./moduleLoader')(config);

    // register screenshot provider
    var screenshotProvider = moduleLoader.loadModuleIfAvailable('screenshotProvider', [config.multiCapabilities]);
    if (screenshotProvider) {
      screenshotProvider.register();
    }

    // load storage provider
    var storageProvider = moduleLoader.loadModuleIfAvailable('storageProvider', [config.multiCapabilities]);

    plugins.loadJasminePlugins();

    // add global matchers
    beforeEach(function () {
      moduleLoader.loadModuleIfAvailable('matchers', []).forEach(function (matchersModule) {
        jasmine.getEnv().addMatchers(matchersModule.getMatchers());
      });
      // load comparison provider and register the custom matcher
      var comparisonProvider = moduleLoader.loadModuleIfAvailable('comparisonProvider', [storageProvider]);
      if (comparisonProvider) {
        comparisonProvider.register();
      }
    });

    browser.setInitialWindowSize();

    // initialize statistic collector
    var statisticCollector = require('./statisticCollector');
    require('./coreReporters/statisticReporter')(config).register();

    require('./coreReporters/paramsReporter')(config).register();
    require('./coreReporters/specLifecycleReporter')(config, storageProvider).register();

    var expectationInterceptor = require('./reporter/expectationInterceptor');
    // register reporters
    var jasmineEnv = jasmine.getEnv();
    moduleLoader.loadModule('reporters', [statisticCollector, expectationInterceptor]).forEach(function (reporter) {
      reporter.register(jasmineEnv);
    });

    // add additional locators
    moduleLoader.loadModule('locators', [statisticCollector]).forEach(function (locator) {
      locator.register(by);
    });

    // register page object factory on global scope
    logger.debug('Loading BDD-style page object factory');
    pageObjectFactory.register(global);
  }).catch(function (error) {
    logger.debug('Test preparer failed! ' + error);
  });
};
