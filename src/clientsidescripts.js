var functions = {};

functions.waitForAngular = function(rootSelector, callback) {
  var MAX_RETRY_ATTEMPTS = 10,
      MAX_TIMEOUT_DELAY = 5000,
      MAX_INTERVAL_STEP = 2000;

  try {
    if (!window.sap) {
      callback('SAPUI5 could not be found on the window');
    }

    var fnDefineTestCooperation = function() {

      jQuery.sap.declare('sap.ui.core.TestCooperation');

      sap.ui.define(['jquery.sap.global', 'sap/ui/base/Metadata', 'sap/ui/thirdparty/datajs'],
        function(jQuery, Metadata, datajs) {
        'use strict';

        var TestCooperation = Metadata.createClass('sap.ui.core.TestCooperation', {

          constructor : function(oEventBus, oCore) {

            this.iPendingTimeouts = 0;
            this.oPendingTimeoutIDs = {};
            this.oTimeoutInfo = {};
            this.aDoNotTrack = [];
            this.aPendingCallbacks = [];
            this.oEventBus = oEventBus;
            this.oCore = oCore;

            this._wrapSetTimeout();
            this._wrapClearTimeout();
            this._wrapOData(this.oEventBus);

            this.oEventBus.subscribe('ODataFinished', this._tryToExecuteCallbacks, this);
            this.oCore.attachUIUpdated(this._tryToExecuteCallbacks);
            jQuery(document).on('ajaxStop', this, this._tryToExecuteCallbacks);
          }
        });

        TestCooperation.prototype.notifyWhenStable = function(fnCallback) {

          if (this.iPendingTimeouts === 0 && jQuery.active === 0 && OData.active === 0 && !this.oCore.getUIDirty() && this.aPendingCallbacks.length === 0) {
            fnCallback();
          } else {
            this.aPendingCallbacks.push(fnCallback);
          }
        };

        TestCooperation.prototype._wrapSetTimeout = function() {
          var that = this,
            fnOriginalTimeout = window.setTimeout;
          window.setTimeout = function(func, delay) {
            var id;
            function wrapper() {
              func.apply();
              that._handleTimeoutFinished(id);
            }
            id = fnOriginalTimeout.call(this, wrapper, delay);
            that._handleTimeoutScheduled(id, func, delay);
            return id;
          };
        };

        TestCooperation.prototype._wrapClearTimeout = function() {
          var that = this,
            fnOriginalTimeout = window.clearTimeout;
          window.clearTimeout = function(id) {
            fnOriginalTimeout.call(this, id);
            that._handleTimeoutFinished(id);
          };
        };

        TestCooperation.prototype._wrapOData = function(oEventBus) {
          if (typeof OData === 'object' && typeof OData.request === 'function' && typeof OData.active !== 'number') {
            var fnOriginalRequest = OData.request;
            var fnRequest = function (oRequest, fnSuccess, fnError, oHandler, oHttpClient, oMetadata) {
              OData.active += 1;
              fnOriginalRequest.call(OData, oRequest, function () {
                try {
                  fnSuccess.apply(this, arguments);
                } finally {
                  OData.active -= 1;
                  oEventBus.publish('ODataFinished');
                }
              },
              function () {
                try {
                  fnError.apply(this, arguments);
                } finally {
                  OData.active -= 1;
                  oEventBus.publish('ODataFinished');
                }
              },
              oHandler, oHttpClient, oMetadata);
            };
            OData.active = 0;
            OData.request = fnRequest;
          };
        };

        TestCooperation.prototype._handleTimeoutScheduled = function(id, func, delay) {
          if (this._isTracked(id, func, delay)) {
            this.oPendingTimeoutIDs[id] = 1;
            this.iPendingTimeouts++;
          }
        };

        TestCooperation.prototype._handleTimeoutFinished = function(id) {
          if (this.aDoNotTrack.indexOf(id) == -1) {
            if (this.oPendingTimeoutIDs.hasOwnProperty(id)) {
              delete this.oPendingTimeoutIDs[id];
              this.iPendingTimeouts--;
            }
          }
          this._tryToExecuteCallbacks();
        };

        TestCooperation.prototype._isTracked = function(id, func, delay) {
          if (delay > MAX_TIMEOUT_DELAY) {
            this.aDoNotTrack.push(id);
            return false;
          } else {
            var bAddNewEntry = !this.oTimeoutInfo.hasOwnProperty(func) || this.oTimeoutInfo[func].delay != delay ||
                new Date().getMilliseconds() - this.oTimeoutInfo[func].callTime > MAX_INTERVAL_STEP;
            if (bAddNewEntry) {
              this.oTimeoutInfo[func] = {"delay": delay, "callCount": 1, "callTime": new Date().getMilliseconds()};
              return true;
            } else {
              if (++this.oTimeoutInfo[func].callCount <= 5) {
                return true;
              } else {
                this.aDoNotTrack.push(id);
                return false;
              }
            }
          }
        };

        TestCooperation.prototype._tryToExecuteCallbacks = function() {

          if (this.iPendingTimeouts === 0 && jQuery.active === 0 && OData.active === 0 && !this.oCore.getUIDirty() && this.aPendingCallbacks.length > 0) {
            do {
              var fnCallback = this.aPendingCallbacks.shift();
              fnCallback();
            } while (this.iPendingTimeouts === 0 && jQuery.active === 0 && OData.active === 0 && !this.oCore.getUIDirty() && this.aPendingCallbacks.length > 0)
          }
        }

        return TestCooperation;

      }, /* bExport= */ true);
    };

    var tryToNotifyCallback = function(attempts) {
      if (sap.ui.TestCooperation) {
        try {
          sap.ui.TestCooperation.notifyWhenStable(callback);
        } catch (e) {
          callback('Unable to notify callback.\nError: ' + e.message);
        }
      } else if (sap.ui.core.TestCooperation) {
        try {
          sap.ui.getCore().registerPlugin({
            startPlugin: function(oCore) {
              sap.ui.TestCooperation = new sap.ui.core.TestCooperation(oCore.getEventBus(), {
                getUIDirty: oCore.getUIDirty.bind(oCore),
                attachUIUpdated: oCore.attachUIUpdated.bind(oCore)
              });
            }
          });
        } catch (e) {
          callback('Unable to instantiate TestCooperation.\nError: ' + e.message);
        }

        if(attempts < 1) {
          if (!sap.ui) {
            callback('SAPUI5 is not present');
          } else {
            callback('retries for notify callback exceeded');
          }
        } else {
          window.setTimeout(function() {tryToNotifyCallback(attempts - 1);}, 1000);
        }
      } else {
        try {
          if (sap.ui) {
            fnDefineTestCooperation();
          } else {
            window.setTimeout(function() {tryToNotifyCallback(attempts - 1);}, 1000);
          }
        } catch (e) {
          callback('Unable to inject TestCooperation.\nError: ' + e.message);
        }

        if(attempts < 1) {
          if (!sap.ui) {
            callback('SAPUI5 is not present');
          } else {
            callback('retries for notify callback exceeded');
          }
        } else {
          window.setTimeout(function() {tryToNotifyCallback(attempts - 1);}, 1000);
        }
      }
    };
    tryToNotifyCallback(MAX_RETRY_ATTEMPTS);
  } catch (err) {
    callback(err.message);
  }
};

/* Publish all the functions as strings to pass to WebDriver's
 * exec[Async]Script.  In addition, also include a script that will
 * install all the functions on window (for debugging.)
 *
 * We also wrap any exceptions thrown by a clientSideScripts function
 * that is not an instance of the Error type into an Error type.  If we
 * don't do so, then the resulting stack trace is completely unhelpful
 * and the exception message is just 'unknown error.'  These types of
 * exceptins are the common case for dart2js code.  This wrapping gives
 * us the Dart stack trace and exception message.
 */
var util = require('util');
var scriptsList = [];
var scriptFmt = (
'try { return (%s).apply(this, arguments); }\n' +
'catch(e) { throw (e instanceof Error) ? e : new Error(e); }');
for (var fnName in functions) {
  if (functions.hasOwnProperty(fnName)) {
    exports[fnName] = util.format(scriptFmt, functions[fnName]);
    scriptsList.push(util.format('%s: %s', fnName, functions[fnName]));
  }
}

exports.installInBrowser = (util.format(
  'window.clientSideScripts = {%s};', scriptsList.join(', ')));
