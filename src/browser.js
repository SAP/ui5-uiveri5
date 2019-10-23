// testrunner
// navigation
var _ = require('lodash');
var clientsidescripts = require('./scripts/clientsidescripts');
var ClassicalWaitForUI5 = require('./scripts/classicalWaitForUI5');
var AUTH_CONFIG_NAME = 'auth';

module.exports = function (browser, config, logger) {

  // attach new function to the global browser object, or override existing ones
  function augmentBrowser() {
    // used in protractor for many scripts and notably for waitForAngular
    // override with added logging
    browser.executeAsyncScript_ = executeAsyncScript_(browser.executeAsyncScript_);

    browser.executeAsyncScriptHandleErrors = executeAsyncScriptHandleErrors;

    browser.get = function (sUrl, vOptions) {
      return browser.testrunner.navigation.to(sUrl, _.pick(vOptions, AUTH_CONFIG_NAME));
    };

    browser.setViewportSize = setViewportSize;

    browser.loadUI5Dependencies = function () {
      return browser._loadUI5Dependencies().then(function () {
        return browser.waitForAngular();
      });
    };

    var waitForUI5Timeout = getWaitForUI5Timeout(config);

    browser._loadUI5Dependencies = function () {
      return browser.executeAsyncScriptHandleErrors('loadUI5Dependencies', {
        waitForUI5Timeout: waitForUI5Timeout,
        waitForUI5PollingInterval: config.timeouts.waitForUI5PollingInterval,
        ClassicalWaitForUI5: ClassicalWaitForUI5,
        useClassicalWaitForUI5: config.useClassicalWaitForUI5
      });
    };
  }

  /*
   * (internal) definitions
   */

  function executeAsyncScript_(originalExecuteAsyncScript_) {
    return function () {
      var code = arguments[0];
      var scriptName = arguments[1];
      var params = arguments[2];
      // log script execution
      logger.trace('Execute async script: ' + scriptName + ' with params: ' + JSON.stringify(params) + ' with code: \n' + JSON.stringify(code));
      //call original function in its context
      return originalExecuteAsyncScript_.apply(browser, arguments)
        .then(function(res) {
          logger.trace('Async script: ' + scriptName + ' result: ' + JSON.stringify(res));
          return res;
        },function(error) {
          logger.trace('Async script: ' + scriptName + ' error: ' + JSON.stringify(error));
          throw error;
        });
    };
  }

  function getWaitForUI5Timeout (config) {
    var ui5SyncDelta = config.timeouts && config.timeouts.waitForUI5Delta;
    return ui5SyncDelta > 0 ? (config.timeouts.allScriptsTimeout - ui5SyncDelta) : 0;
  }

  function executeAsyncScriptHandleErrors(scriptName, params) {
    var code = clientsidescripts[scriptName];
    logger.debug('Execute async script: ' + scriptName + ' with params: ' + JSON.stringify(params));
    logger.trace('Execute async script code: \n' + JSON.stringify(code));
    params = params || {};
    return browser.executeAsyncScript(code,params)
      .then(function (res) {
        if (res.log) {
          logger.debug('Async script: ' + scriptName + ' logs: \n' + res.log);
        }
        if (res.error) {
          logger.debug('Async script: ' + scriptName + ' error: ' + JSON.stringify(res.error));
          throw new Error(scriptName + ': ' + res.error);
        }
        logger.debug('Async script: ' + scriptName + ' result: ' + JSON.stringify(res.value));
        return res.value;
      });
  }

  function setViewportSize(viewportSize) {
    return browser.executeScriptWithDescription(clientsidescripts.getWindowToolbarSize, 'browser.setViewportSize').then(function (toolbarSize) {
      browser.driver.manage().window().setSize(viewportSize.width * 1 + toolbarSize.width, viewportSize.height * 1 + toolbarSize.height); // convert to integer implicitly
    });
  }

  /*
   * expose public
   */

  return {
    augmentBrowser: augmentBrowser
  };
};
