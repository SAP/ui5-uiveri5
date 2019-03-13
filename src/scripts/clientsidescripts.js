/* global Promise */
var util = require('util');

// functions to be executed in the browser
// name each function to get meaningful stack traces in case of error!
var mFunctions = {

  // load all UI5 dependencies asynchronously at once before test start.
  // when fnCallback will is called, the script will be considered completed
  // fnCallback will be called with an object argument
  // which will always have a 'log' and will have 'error' only when loading of dependensies was unsuccessful
  loadUI5Dependencies: function loadUI5Dependencies (mScriptParams, fnCallback) {
    var sDebugLog = 'Loading waitForUI5 implementation, params: ' +
      'useClassicalWaitForUI5: '  +  mScriptParams.useClassicalWaitForUI5 +
      ' ,waitForUI5Timeout: ' + mScriptParams.waitForUI5Timeout + 'ms' +
      ' ,waitForUI5PollingInterval: ' + mScriptParams.waitForUI5PollingInterval + 'ms';

    if (!window.sap || !window.sap.ui) {
      fnCallback({log: sDebugLog, error: 'No UI5 on this page'});
    }

    /* global uiveri5 */
    window.uiveri5 = window.uiveri5 || {};

    loadOPAControlFinder().then(function () {
      if (mScriptParams.useClassicalWaitForUI5) {
        sDebugLog += '\nLoading classical waitForUI5 implementation.';
        return loadClassicalWaitForUI5();
      } else {
        sDebugLog += '\nLoading OPA5 waitForUI5 implementation.';
        return loadOPAWaitForUI5().catch(function (sError) {
          sDebugLog += '\nFailed to load OPA5 waitForUI5, Fallback to loading classical waitForUI5 implementation. Details: ' + sError;
          return loadClassicalWaitForUI5();
        });
      }
    }).then(function (sLog) {
      fnCallback({log: sDebugLog + (sLog || '')});
    }).catch(function (sError, sLog) {
      fnCallback({error: sError, log: sDebugLog + (sLog || '')});
    });

    // --- helper function declarations below ---

    function loadClassicalWaitForUI5() {
      return new Promise(function (resolve) {
        if (uiveri5.ClassicalWaitForUI5) {
          resolve();
        } else {
          var ClassicalWaitForUI5 = new Function('return (' + mScriptParams.ClassicalWaitForUI5 + ').apply(this, arguments)');
          sap.ui.getCore().registerPlugin({
            startPlugin: function (oCore) {
              window.uiveri5.ClassicalWaitForUI5 = new ClassicalWaitForUI5(mScriptParams.waitForUI5Timeout, {
                getUIDirty: oCore.getUIDirty.bind(oCore),
                attachUIUpdated: oCore.attachUIUpdated.bind(oCore)
              });
              resolve();
            }
          });
        }
      });
    }

    function loadOPAWaitForUI5() {
      return new Promise(function (resolve, reject) {
        if (uiveri5.autoWaiterAsync) {
          resolve();
        } else {
          var onError = function (oError) {
            reject('Cannot define uiveri5.autoWaiterAsync. Details: ' + oError);
          };
          try {
            sap.ui.require([
              'sap/ui/test/autowaiter/_autoWaiterAsync'
            ], function(_autoWaiterAsync) {
              _autoWaiterAsync.extendConfig({
                timeout: mScriptParams.waitForUI5Timeout,
                interval: mScriptParams.waitForUI5PollingInterval
              });
              window.uiveri5.autoWaiterAsync = _autoWaiterAsync;
              resolve();
            }, onError);
          } catch (oError) {
            onError(oError);
          }
        }
      });
    }

    function loadOPAControlFinder() {
      return new Promise(function (resolve) {
        if (uiveri5._ControlFinder) {
          resolve();
        } else {
          sDebugLog += '\nLoading OPA5 control locator utilities.';
          var onError = function (oError) {
            // only throw error if dependency is missing when a control locator is actually used
            resolve('Control locators will not be enabled.' +
            ' Minimum UI5 versions supporting control locators: 1.52.12; 1.54.4; 1.55 and up. Details: ' + oError);
          };
          try {
            sap.ui.require([
              'sap/ui/test/_ControlFinder'
            ], function (_ControlFinder) {
              window.uiveri5._ControlFinder = _ControlFinder;
              resolve();
            }, onError);
          } catch (oError) {
            onError(oError);
          }
        }
      });
    }
  },

  waitForAngular: function waitForAngular (mScriptParams, fnCallback) {
    if (!window.sap || !window.sap.ui) {
      fnCallback('waitForUI5: no UI5 on this page.');
    } else {
      if (uiveri5.autoWaiterAsync) {
        uiveri5.autoWaiterAsync.waitAsync(fnCallback);
      } else if (uiveri5.ClassicalWaitForUI5) {
        uiveri5.ClassicalWaitForUI5.notifyWhenStable(fnCallback);
      } else {
        fnCallback('waitForUI5: no waitForUI5 implementation is currently loaded.');
      }
    }
  },

  getControlProperty: function getControlProperty (mScriptParams) {
    if (!uiveri5._ControlFinder) {
      throw new Error('Your application needs a newer version of UI5 to use control locators!' +
      ' Minimum versions supported: 1.52.12; 1.54.4; 1.55 and up.');
    }

    try {
      var control = uiveri5._ControlFinder._getControlForElement(mScriptParams.elementId);
      if (control) {
        return {
          property: uiveri5._ControlFinder._getControlProperty(control, mScriptParams.property)
        };
      } else {
        throw new Error('Element with ID "' + mScriptParams.elementId + '" is not part of a control DOM representation tree');
      }
    } catch (oError) {
      return {
        error: 'Failed to get control property. Details: ' + oError
      };
    }
  },

  findByControl: function findByControl (sMatchers, oParentElement) {
    if (!uiveri5._ControlFinder) {
      throw new Error('Your application needs a newer version of UI5 to use control locators!' +
      ' Minimum versions supported: 1.52.12; 1.54.4; 1.55 and up.');
    }

    var mMatchers = JSON.parse(sMatchers);
    if (oParentElement) {
      var control = uiveri5._ControlFinder._getControlForElement(oParentElement.id);
      mMatchers.ancestor = control && [[control.getId()]];
    }

    if (mMatchers.id && mMatchers.id.regex) {
      mMatchers.id = new RegExp(mMatchers.id.regex.source, mMatchers.id.regex.flags);
    }
    if (mMatchers.properties) {
      Object.keys(mMatchers.properties).forEach(function (sProperty) {
        var mRegexp = mMatchers.properties[sProperty].regex;
        if (mRegexp) {
          mMatchers.properties[sProperty] = new RegExp(mRegexp.source, mRegexp.flags);
        }
      });
    }

    return uiveri5._ControlFinder._findElements(mMatchers);
  },

  getLatestLog: function getLatestLog () {
    var sLog = '';
    if (uiveri5._ControlFinder && uiveri5._ControlFinder._getLatestLog) {
      sLog = uiveri5._ControlFinder._getLatestLog();
    }
    return  sLog;
  },

  getUI5Version: function() {
    return sap.ui.getVersionInfo();
  },

  getWindowToolbarSize: function getWindowToolbarSize () {
    return {
      width: window.outerWidth - window.innerWidth,
      height: window.outerHeight - window.innerHeight
    };
  },

  hideScrollbars: function hideScrollbars () {
    if ($) {
      hideScrollbars();
    } else if (window.sap && window.sap.ui) {
      sap.ui.require([
        'sap/ui/thirdparty/jquery'
      ], function (jQuery) {
        window.$ = jQuery;
        hideScrollbars();
      });
    }

    function hideScrollbars() {
      $('*').each(function (iIndex, oDOMElement) {
        var oElement = $(oDOMElement);
        ['overflow', 'overflow-x', 'overflow-y'].forEach(function (sAttribute) {
          // force style and layout recalculations
          /* eslint no-unused-vars: 0 */
          var scrollTop = oDOMElement.clientTop;
          var sValue = oElement.css(sAttribute);
          while (sValue && ['hidden', 'visible'].indexOf(sValue) < 0) {
            oElement.css(sAttribute, 'hidden');
            sValue = window.getComputedStyle(oDOMElement)[sAttribute];
          }
        });
      });
    }
  },

  startLogCollection: function startLogCollection (mScriptParams) {
    if (!window.sap || !window.sap.ui) {
      throw new Error('startLogCollection: no UI5 on this page.');
    }

    var sError = 'Your application needs a minimum version of UI5 v1.64 to collect browser logs!';

    try {
      sap.ui.require([
        'sap/ui/test/_BrowserLogCollector'
      ], function (_BrowserLogCollector) {
        window.uiveri5 = window.uiveri5 || {};
        window.uiveri5._BrowserLogCollector = _BrowserLogCollector.getInstance();
        window.uiveri5._BrowserLogCollector.start(mScriptParams.level);
      }, function (oError) {
        throw new Error(sError + ' Details: ' + oError);
      });
    } catch (oError) {
      throw new Error(sError + ' Details: ' + oError);
    }
  },

  getAndClearLogs: function getAndClearLogs () {
    if (!window.uiveri5._BrowserLogCollector) {
      throw new Error('Log collection is not set up! Call "startLogCollection" before "getAndClearLogs"');
    }
    return window.uiveri5._BrowserLogCollector.getAndClearLogs().logs;
  },

  stopLogsCollection: function stopLogsCollection () {
    if (!window.uiveri5._BrowserLogCollector) {
      throw new Error('Log collection is not set up! Call "startLogCollection" before "stopLogsCollection"');
    }
    return window.uiveri5._BrowserLogCollector.stop();
  }
};

/* Publish the functions as strings to pass to WebDriver's exec[Async]Script.
 * Include a script that will install all the functions on window (for debugging)
 *
 * We wrap any exception thrown by a clientSideScripts function, that is not an instance of the Error type,
 * into an Error type in order to get a useful stack trace.
 * In chromium, the stack trace sometimes gets discarded (see: chromedriver/js/call_function.js:364)
 * As a workaround, wrap all errors and add their stack traces to the new Error's message
 */
var scriptsList = [];
var scriptFmt = (
  'try { return (%s).apply(this, arguments); }\n' +
  'catch(e) { throw new Error(e instanceof Error ? e.message + e.stack : e); }'
);
for (var fnName in mFunctions) {
  if (mFunctions.hasOwnProperty(fnName)) {
    exports[fnName] = util.format(scriptFmt, mFunctions[fnName]);
    scriptsList.push(util.format('%s: %s', fnName, mFunctions[fnName]));
  }
}

exports.installInBrowser = (util.format(
  'window.clientSideScripts = {%s};', scriptsList.join(', ')));
