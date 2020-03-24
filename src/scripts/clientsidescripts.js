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
    var sDebugLog = 'Loading UI5 dependencies';

    // retry checking for UI5
    var waitedTime = 0;
    (function wait () {
      if (window.sap && window.sap.ui) {

        // wait for UI5 core to complete initialisation
        window.sap.ui.getCore().attachInit(function() {

          /* global uiveri5 */
          window.uiveri5 = window.uiveri5 || {};

          loadControlFinder()
            .then(function () {
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
        });
      } else if (waitedTime < mScriptParams.autoWait.timeout) {
        waitedTime += mScriptParams.autoWait.interval;
        setTimeout(wait, mScriptParams.autoWait.interval);
      } else {
        fnCallback({log: sDebugLog, error: 'No UI5 on this page'});
      }
    })();

    // --- helper function declarations below ---
    function loadClassicalWaitForUI5() {
      return new Promise(function (resolve) {
        if (window.uiveri5.ClassicalWaitForUI5) {
          resolve();
        } else {
          var ClassicalWaitForUI5 = new Function('return (' + mScriptParams.ClassicalWaitForUI5 + ').apply(this, arguments)');
          window.sap.ui.getCore().registerPlugin({
            startPlugin: function (oCore) {
              window.uiveri5.ClassicalWaitForUI5 = new ClassicalWaitForUI5(mScriptParams.autoWait.timeout, {
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
        if (window.uiveri5.autoWaiterAsync) {
          resolve();
        } else {
          var onError = function (oError) {
            reject('Cannot define uiveri5.autoWaiterAsync. Details: ' + oError);
          };
          try {
            window.sap.ui.require([
              'sap/ui/test/autowaiter/_autoWaiterAsync'
            ], function(_autoWaiterAsync) {
              _autoWaiterAsync.extendConfig(mScriptParams.autoWait);
              window.uiveri5.autoWaiterAsync = _autoWaiterAsync;
              resolve();
            }, onError);
          } catch (oError) {
            onError(oError);
          }
        }
      });
    }

    function loadControlFinder() {
      return new Promise(function (resolve) {
        if (window.uiveri5._ControlFinder) {
          resolve();
        } else {
          sDebugLog += '\nLoading OPA5 control locator utilities.';
          var onError = function (oError) {
            // only throw error if dependency is missing when a control locator is actually used
            resolve('Control locators will not be enabled.' +
            ' Minimum UI5 versions supporting control locators: 1.52.12; 1.54.4; 1.55 and up. Details: ' + oError);
          };
          try {
            window.sap.ui.require([
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

  waitForUI5: function waitForUI5 (fnCallback) {
    if (!window.sap || !window.sap.ui) {
      fnCallback('waitForUI5: no UI5 on this page.');
    } else {
      if (window.uiveri5.autoWaiterAsync) {
        window.uiveri5.autoWaiterAsync.waitAsync(fnCallback);
      } else if (window.uiveri5.ClassicalWaitForUI5) {
        window.uiveri5.ClassicalWaitForUI5.notifyWhenStable(fnCallback);
      } else {
        fnCallback('waitForUI5: no waitForUI5 implementation is currently loaded.');
      }
    }
  },

  getControlProperty: function getControlProperty (mScriptParams) {
    if (!window.uiveri5 ) {
      return {
        error: 'UI5 dependencies are not loaded on this page'
      };
    } else if (!window.uiveri5._ControlFinder) {
      return {
        error: 'Your application needs a newer version of UI5 to use control locators!' +
          ' Minimum versions supported: 1.52.12; 1.54.4; 1.55 and up.'
      };
    }

    try {
      var control = window.uiveri5._ControlFinder._getControlForElement(mScriptParams.elementId);
      if (control) {
        return {
          value: window.uiveri5._ControlFinder._getControlProperty(control, mScriptParams.property)
        };
      } else {
        return {
          error: 'Element with ID "' + mScriptParams.elementId + '" is not part of a control DOM representation tree'
        };
      }
    } catch (oError) {
      return {
        error: 'Failed to get control property. Details: ' + oError
      };
    }
  },

  // called directly from webdriver.by so does not comply with executeScriptHandleErrors result structure
  findByControl: function findByControl (sMatchers, oParentElement) {
    if (!window.uiveri5) {
      throw new Error('UI5 dependencies are not loaded on this page');
    } else if (!window.uiveri5._ControlFinder) {
      throw new Error('Your application needs a newer version of UI5 to use control locators!' +
      ' Minimum versions supported: 1.52.12; 1.54.4; 1.55 and up.');
    }

    var mMatchers = JSON.parse(sMatchers);
    if (oParentElement) {
      var control = window.uiveri5._ControlFinder._getControlForElement(oParentElement.id);
      mMatchers.ancestor = control && [[control.getId()]];
    }

    // this parsing is used for ui5 versions < 1.74.0
    _convertPlainObjectToRegex(mMatchers);

    function _convertPlainObjectToRegex(matchers) {
      for (var name in matchers) {
        if (matchers[name].regex) {
          matchers[name] = new window.RegExp(matchers[name].regex.source, matchers[name].regex.flags);
        } else if (typeof matchers[name] === 'object') {

          for (var key in matchers[name]) {
            var mRegexp = matchers[name][key].regex;
            if (mRegexp) {
              matchers[name][key] = new window.RegExp(mRegexp.source, mRegexp.flags);
            } else if (typeof matchers[name] === 'object') {
              _convertPlainObjectToRegex(matchers[name][key]);
            }
          }
        }
      }
    }

    return window.uiveri5._ControlFinder._findElements(mMatchers);
  },

  // called with driver.executScript from findElements overrideso so does not comply ith executeScriptHandleErrors result structure
  getLatestLog: function getLatestLog () {
    var sLog = '';
    if (window.uiveri5._ControlFinder && window.uiveri5._ControlFinder._getLatestLog) {
      sLog = window.uiveri5._ControlFinder._getLatestLog();
    }
    return sLog;
  },

  getUI5Version: function() {
    var versionInfo = window.sap.ui.getVersionInfo();
    return {
      value: {
        version: versionInfo.version,
        buildTimestamp: versionInfo.buildTimestamp
      }
    };
  },
  
  getWindowToolbarSize: function getWindowToolbarSize () {
    return {
      value: {
        width: window.outerWidth - window.innerWidth,
        height: window.outerHeight - window.innerHeight
      }
    };
  },

  hideScrollbars: function hideScrollbars (mScriptParams,fnCallback) {   
    if (window.uiveri5.$) {
      hideScrollbars();
    } else if (window.sap && window.sap.ui) {
      window.sap.ui.require([
        'sap/ui/thirdparty/jquery'
      ], function (jQuery) {
        window.uiveri5.$ = jQuery;
        hideScrollbars();
      }, function (error) {
        fnCallback({error: 'Error while loading jquery module, details: ' + error});
      });
    }

    function hideScrollbars() {
      try {
        var elements = window.uiveri5.$('*');
        var log = 'Processing: ' + elements.length + ' elements';
        elements.each(function (iIndex, oDOMElement) {
          var oElement = window.uiveri5.$(oDOMElement);
          ['overflow', 'overflow-x', 'overflow-y'].forEach(function (sAttribute) {
            // force style and layout recalculations
            /* eslint no-unused-vars: 0 */
            var scrollTop = oDOMElement.clientTop;
            var sValue = oElement.css(sAttribute);
            while (sValue && (['hidden', 'visible'].indexOf(sValue) < 0)) {
              oElement.css(sAttribute, 'hidden');
              sValue = window.getComputedStyle(oDOMElement)[sAttribute];
              if (sValue === 'auto') {
                log += '\nElement with id: ' + oDOMElement.id + ' has attribute: ' + sAttribute + ' that stays: ' + sValue;
                break;
              }
            }
          });
        });
        fnCallback({log: log});
      } catch (error) {
        fnCallback({error: 'Error while processing dom, details: ' + error});
      }
    }
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
