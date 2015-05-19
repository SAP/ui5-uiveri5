var functions = {};

functions.waitForAngular = function(rootSelector, callback) {
  var MAX_RETRY_ATTEMPTS = 10;

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
            this.aPendingCallbacks = [];
            this.oEventBus = oEventBus;
            this.oCore = oCore;

            this._redefineIntervalTrigger();
            this._redefinejQuerySapAct();
            this._wrapDelayedCall(this.oEventBus);
            this._wrapClearDelayedCall(this.oEventBus);
            this._wrapOData(this.oEventBus);

            this.oEventBus.subscribe('delayedCallScheduled', this._handleTimeoutScheduled, this);
            this.oEventBus.subscribe('delayedCallFinished', this._handleTimeoutFinished, this);
            this.oEventBus.subscribe('delayedCallCancelled', this._handleTimeoutFinished, this);
            this.oEventBus.subscribe('intervalScheduled', this._handleTimeoutFinished, this);
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

        TestCooperation.prototype._redefineIntervalTrigger = function() {

          jQuery.sap.declare('sap.ui.core.IntervalTrigger');

          sap.ui.define(['jquery.sap.global', './EventBus'],
            function(jQuery, EventBus) {
            'use strict';

              var _EVENT_ID = 'sapUiIntervalTrigger-event';

              var IntervalTrigger = sap.ui.base.Object.extend('sap.ui.core.IntervalTrigger', {
                constructor : function(iInterval) {
                  sap.ui.base.Object.apply(this);

                  this._oEventBus = new EventBus();

                  this._delayedCallId = null;
                  this._triggerProxy = jQuery.proxy(trigger, this);

                  this._iInterval = 0;
                  if (iInterval) {
                    this.setInterval(iInterval);
                  }
                }
              });

              var trigger = function() {
                jQuery.sap.clearDelayedCall(this._delayedCallId);

                // if interval is active and there are registered listeners
                var bHasListeners = this._oEventBus._defaultChannel.hasListeners(_EVENT_ID);
                if (this._iInterval > 0 && bHasListeners) {
                  this._oEventBus.publish(_EVENT_ID);

                  var delayedCallId = jQuery.sap.delayedCall(this._iInterval, this, this._triggerProxy);
                  this._delayedCallId = delayedCallId;
                  sap.ui.getCore().getEventBus().publish('intervalScheduled', {id: delayedCallId});
                }
              };

              IntervalTrigger.prototype.destroy = function() {
                sap.ui.base.Object.prototype.destroy.apply(this, arguments);

                delete this._triggerProxy;

                this._oEventBus.destroy();
                delete this._oEventBus;
              };

              IntervalTrigger.prototype.setInterval = function(iInterval) {
                jQuery.sap.assert((typeof iInterval === 'number'), 'Interval must be an integer value');

                // only change and (re)trigger if the interval is different
                if (this._iInterval !== iInterval) {
                  this._iInterval = iInterval;
                  this._triggerProxy();
                }
              };

              IntervalTrigger.prototype.addListener = function(fnFunction, oListener) {
                this._oEventBus.subscribe(_EVENT_ID, fnFunction, oListener);

                this._triggerProxy();
              };

              IntervalTrigger.prototype.removeListener = function(fnFunction, oListener) {
                this._oEventBus.unsubscribe(_EVENT_ID, fnFunction, oListener);
              };

              /**
               * @see sap.ui.base.Object#getInterface
               * @public
               */
              IntervalTrigger.prototype.getInterface = function() {
                return this;
              };

            return IntervalTrigger;

          }, /* bExport= */ true);
        };

        TestCooperation.prototype._redefinejQuerySapAct = function() {

          jQuery.sap.declare('jQuery.sap.act');

          sap.ui.define(['jquery.sap.global'],
            function(jQuery) {
            'use strict';

            if (typeof window.jQuery.sap.act === 'object' || typeof window.jQuery.sap.act === 'function' ) {
              return;
            }

            var _act = {},
              _active = true,
              _deactivatetimer = null,
              _I_MAX_IDLE_TIME = 10000, //max. idle time in ms
              _deactivateSupported = !!window.addEventListener, //Just skip IE8
              _aActivateListeners = [],
              _activityDetected = false,
              _domChangeObserver = null;

            function _onDeactivate(){
              _deactivatetimer = null;

              if (_activityDetected) {
                _onActivate();
                return;
              }

              _active = false;
              _domChangeObserver.observe(document.documentElement, {childList: true, attributes: true, subtree: true, characterData: true});
            }

            function _onActivate(){
              // Never activate when document is not visible to the user
              if (document.hidden === true) {
                // In case of IE<10 document.visible is undefined, else it is either true or false
                return;
              }

              if (!_active) {
                _active = true;
                _triggerEvent(_aActivateListeners);
                _domChangeObserver.disconnect();
              }
              if (_deactivatetimer) {
                _activityDetected = true;
              } else {
                _deactivatetimer = setTimeout(_onDeactivate, _I_MAX_IDLE_TIME);
                sap.ui.getCore && sap.ui.getCore().getEventBus().publish('intervalScheduled', {id: _deactivatetimer});
                _activityDetected = false;
              }
            }

            function _triggerEvent(aListeners){
              if (aListeners.length == 0) {
                return;
              }
              var aEventListeners = aListeners.slice();
              setTimeout(function(){
                var oInfo;
                for (var i = 0, iL = aEventListeners.length; i < iL; i++) {
                  oInfo = aEventListeners[i];
                  oInfo.fFunction.call(oInfo.oListener || window);
                }
              }, 0);
            }

            _act.attachActivate = function(fnFunction, oListener){
              _aActivateListeners.push({oListener: oListener, fFunction:fnFunction});
            };

            _act.detachActivate = function(fnFunction, oListener){
              for (var i = 0, iL = _aActivateListeners.length; i < iL; i++) {
                if (_aActivateListeners[i].fFunction === fnFunction && _aActivateListeners[i].oListener === oListener) {
                  _aActivateListeners.splice(i,1);
                  break;
                }
              }
            };

            _act.isActive = !_deactivateSupported ? function(){ return true; } : function(){ return _active; };

            _act.refresh = !_deactivateSupported ? function(){} : _onActivate;

            if (_deactivateSupported) {
              var aEvents = ['resize', 'orientationchange', 'mousemove', 'mousedown', 'mouseup', //'mouseout', 'mouseover',
                       'touchstart', 'touchmove', 'touchend', 'touchcancel', 'paste', 'cut', 'keydown', 'keyup',
                       'DOMMouseScroll', 'mousewheel'];
              for (var i = 0; i < aEvents.length; i++) {
                window.addEventListener(aEvents[i], _act.refresh, true);
              }

              if (window.MutationObserver) {
                _domChangeObserver = new window.MutationObserver(_act.refresh);
                } else if (window.WebKitMutationObserver) {
                  _domChangeObserver = new window.WebKitMutationObserver(_act.refresh);
                } else {
                  _domChangeObserver = {
                    observe : function(){
                      document.documentElement.addEventListener('DOMSubtreeModified', _act.refresh);
                    },
                    disconnect : function(){
                      document.documentElement.removeEventListener('DOMSubtreeModified', _act.refresh);
                    }
                  };
                }

              if (typeof (document.hidden) === 'boolean') {
                document.addEventListener('visibilitychange', function() {
                  // Only trigger refresh if document has changed to visible
                  if (document.hidden !== true) {
                    _act.refresh();
                  }
                }, false);
              }

              _onActivate();
            }

            jQuery.sap.act = _act;

            return jQuery;

          }, /* bExport= */ false);

        };

        TestCooperation.prototype._wrapDelayedCall = function(oEventBus) {
          jQuery.sap.delayedCall = function delayedCall(iDelay, oObject, method, aParameters) {
            var id = setTimeout(function(){
              if (jQuery.type(method) == 'string') {
                method = oObject[method];
              }
              method.apply(oObject, aParameters || []);
              oEventBus.publish('delayedCallFinished', {id: id});
            }, iDelay);
            oEventBus.publish('delayedCallScheduled', {id: id});
            return id;
          };
        };

        TestCooperation.prototype._wrapClearDelayedCall = function(oEventBus) {
          jQuery.sap.clearDelayedCall = function clearDelayedCall(sDelayedCallId) {
            oEventBus.publish('delayedCallCancelled', {id: sDelayedCallId});
            clearTimeout(sDelayedCallId);
            return this;
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

        TestCooperation.prototype._handleTimeoutScheduled = function(channel, name, e) {
          this.oPendingTimeoutIDs[e.id] = 1;
          this.iPendingTimeouts++;
        };

        TestCooperation.prototype._handleTimeoutFinished = function(channel, name, e) {
          if (this.oPendingTimeoutIDs.hasOwnProperty(e.id)) {
            delete this.oPendingTimeoutIDs[e.id];
            this.iPendingTimeouts--;
          }
          this._tryToExecuteCallbacks();
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
