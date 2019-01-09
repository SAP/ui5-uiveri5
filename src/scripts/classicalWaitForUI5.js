/**
* @typedef PendingTimeout
* @type {Object}
* @property {number} id
* @property {string} errStack - caller fn stack
* @property {number} delay - requested timeout delay
* @property {function} func - caller fn
*/

/**
 * @typedef PendingXhr
 * @type {Object}
 * @property {number} id
 * @property {string} errStack - caller fn stack
 */

/**
 * @typedef FunctionInfo
 * @type {Object}
 * @property {function} func - caller fn
 * @property {number} delay - requested timeout delay
 * @property {number} callCount - how many times same timeout was requested
 * @property {string} errStack - caller fn stack
 */

/**
 * @typedef TimeoutInfo
 * @type {Object.<number: hashed errStack and delay, FunctionInfo>}
 */

var ClassicalWaitForUI5 = function (waitForUI5Timeout, oCore) {
  var EXECUTE_CALLBACKS_REG_EXP = /_scheduleCallbackExecution/;
  var MAX_TIMEOUT_DELAY = 5000;
  var TIMEOUT_CALL_COUNT_THRESHOLD = 5;

  this._bSameTick = false;
  /** @type {PendingTimeout[]} */
  this.aPendingTimeouts = [];
  /** @type {PendingXhr[]} */
  this.aPendingXhrs = [];
  this.iXhrSeq = 0;
  /** @type {TimeoutInfo} */
  this.oTimeoutInfo = {};
  this.oCore = oCore;

  this.debug = /sap-ui-classical-waitforui5-debug=true/.test(window.location.search);

  /**
   * Mark the callback as pending if something is still in progress.
   * Execute the callback immediately if:
   * - no pending timeouts
   * - no pending XHRs
   * - no pending callback
   */
  this.notifyWhenStable = function(fnCallback) {
    var that = this;
    if (this.aPendingTimeouts.length === 0 && this.aPendingXhrs.length === 0 && !this.oCore.getUIDirty()
      && !this.fnPendingCallback) {
      fnCallback();
      this.oTimeoutInfo = {}; // Clear all recorded timeouts in order to can synchronise again (call count reset)
    } else {
      that.fnPendingCallback = fnCallback;

      if (waitForUI5Timeout > 0) {
        that.iGuardingTimeoutId = that.fnOriginalSetTimeout.call(window, function() {
          var msg = 'Timeout waiting to synchronize with UI5 after ' + waitForUI5Timeout + ' ms.\n'
            + that._getPendingCallbacksInfo('Pending timeouts: ' + that.aPendingTimeouts.length, that.aPendingTimeouts)
            + that._getPendingCallbacksInfo('\nPending XHRs: ' + that.aPendingXhrs.length, that.aPendingXhrs);

          that._logDebugMessage(msg);
          that.fnPendingCallback(msg);
          that.fnPendingCallback = null;
          that.iGuardingTimeoutId = null;
        }, waitForUI5Timeout);
      }
    }
  };

  /**
   * Handle new timeout.
   * @see _handleTimeoutFinished
   * @see _handleTimeoutScheduled
   * @see _resolveCurrentStackTrace
   * @return {number} timeout id
   */
  this._wrapSetTimeout = function() {
    var that = this;
    that.fnOriginalSetTimeout = window.setTimeout;
    window.setTimeout = function(func, delay) {
      var id;
      function wrapper() {
        func.apply();
        that._handleTimeoutFinished(id);
      }
      id = that.fnOriginalSetTimeout.call(window, wrapper, delay);
      that._handleTimeoutScheduled(id, func, delay, that._resolveCurrentStackTrace());
      return id;
    };
  };

  /**
   * If timeout is canceled handle it like finished.
   * @see _handleTimeoutFinished
   */
  this._wrapClearTimeout = function() {
    var that = this;
    that.fnOriginalClearTimeout = window.clearTimeout;
    window.clearTimeout = function(id) {
      that.fnOriginalClearTimeout.call(window, id);
      that._handleTimeoutFinished(id);
    };
  };

  /**
   * Manage XHR requests.
   * @see _resolveCurrentStackTrace
   * @see _logDebugMessage
   * @see _removeItemFromTracking
   * @see _addItemForTracking
   * @see _tryToExecuteCallback
   */
  this._wrapXHR = function() {
    var that = this;
    that.fnOriginalXhrSend = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.send = function() {
      var errStack = that._resolveCurrentStackTrace();
      var xhrId = that.iXhrSeq++;
      this.addEventListener('readystatechange', function() {
        if (this.readyState == 4) {
          var isXhrDeleted = that._removeItemFromTracking(xhrId, that.aPendingXhrs);
          if (isXhrDeleted) {
            that._logDebugMessage('XHR finished. ID: ' + xhrId + ' Pending XHRs: ' + that.aPendingXhrs.length);
            that._tryToExecuteCallback();
          }
        }
      });
      that._addItemForTracking({'id': xhrId, 'errStack': errStack}, that.aPendingXhrs);
      that._logDebugMessage('XHR started. Pending XHRs: ' + that.aPendingXhrs.length);
      that.fnOriginalXhrSend.apply(this, arguments);
    };
  };

  /**
   * When new timeout is scheduled and if it's tracked: add it to the pending timeouts.
   * @param {number} id
   * @param {function} func
   * @param {number} delay
   * @param {string} errStack
   * @see _isTimeoutTrackable
   * @see _addItemForTracking
   * @see _logDebugMessage
   */
  this._handleTimeoutScheduled = function(id, func, delay, errStack) {
    delay = typeof delay == 'number' ? delay : 0;
    var that = this;
    if (this._isTimeoutTrackable(id, func, delay, errStack)) {
      this._addItemForTracking({'id': id, 'errStack': errStack, 'delay': delay,
        'func': func.toString().replace(/"/g, '\'')}, that.aPendingTimeouts);
      this._logDebugMessage('Timeout scheduled. Timer ID: ' + id + ' Delay: ' + delay + '. Pending timeouts: '
        + this.aPendingTimeouts.length);
    }
  };

  /**
   * When timeout is finished and if it's tracked: delete it.
   * @param {number} id
   * @see _removeItemFromTracking
   * @see _logDebugMessage
   * @see _tryToExecuteCallback
   */
  this._handleTimeoutFinished = function(id) {
    var isTimeoutDeleted = this._removeItemFromTracking(id, this.aPendingTimeouts);
    if (isTimeoutDeleted) {
      this._logDebugMessage('Timeout with ID ' + id + ' finished. Pending timeouts: '
        + this.aPendingTimeouts.length);
      this._tryToExecuteCallback();
    }
  };

  /**
   * Check if the timeout should be tracked.
   * Don't track the timeout, if:
   * - it's come from the _tryToExecuteCallback with no delay
   * - the delay is bigger than the MAX_TIMEOUT_DELAY
   * - the call count is bigger that the TIMEOUT_CALL_COUNT_THRESHOLD
   * Track the timeout if isn't already tracked
   * @param {number} id
   * @param {function} func
   * @param {number} delay
   * @param {string} errStack
   * @see _getFunctionName
   * @see _removeItemFromTracking
   * @see _logDebugMessage
   * @see _hashTimeout
   * @return {boolean} if the timeout is tracked
   */
  this._isTimeoutTrackable = function(id, func, delay, errStack) {
    if ((delay === 0 && EXECUTE_CALLBACKS_REG_EXP.test(this._getFunctionName(func))) // the pending timeout from _tryToExecuteCallback should not be tracked
      || delay > MAX_TIMEOUT_DELAY) { // do not track request longer than 5 sec
      this._removeItemFromTracking(id, this.aPendingTimeouts);
      this._logDebugMessage('Timeout skipped from tracking. Timer ID: ' + id + ' Delay: ' + delay + ' Details: '
        + errStack);
      return false;
    } else {
      var currentTimeoutHash = this._hashTimeout(errStack, delay).toString();
      var isNewTimeout = !this.oTimeoutInfo.hasOwnProperty(currentTimeoutHash);
      if (isNewTimeout) {
        this.oTimeoutInfo[currentTimeoutHash] = {'func': func.toString().replace(/"/g, '\''), 'delay': delay,
          'callCount': 1, 'errStack': errStack};
        return true;
      } else {
        if (++this.oTimeoutInfo[currentTimeoutHash].callCount <= TIMEOUT_CALL_COUNT_THRESHOLD) {
          this._logDebugMessage('Increased call count Timer ID: ' + id + ' Delay: ' + delay + ' Call count: '
            + this.oTimeoutInfo[currentTimeoutHash].callCount);
          return true;
        } else {
          this._removeItemFromTracking(id, this.aPendingTimeouts);
          this._logDebugMessage('Timeout skipped from tracking because exceed it the maximum call count. '
            + 'Timer ID: ' + id + ' Delay: ' + delay + ' Stack: ' + errStack);
          return false;
        }
      }
    }
  };

  /**
   * Execute pending callback if it's in different ticks.
   * The tick should be different because the timeout can be canceled.
   */
  this._tryToExecuteCallback = function() {
    if (!this._bSameTick) {
      var that = this;
      this._bSameTick = true;
      window.setTimeout(function _scheduleCallbackExecution() {
        if (that.aPendingTimeouts.length === 0 && that.aPendingXhrs.length === 0 && !that.oCore.getUIDirty()
          && that.fnPendingCallback) {
          that.fnPendingCallback();
          that.fnPendingCallback = null;
          if (waitForUI5Timeout > 0) {
            that.fnOriginalClearTimeout.call(window, that.iGuardingTimeoutId);
            that.iGuardingTimeoutId = null;
          }
          that.oTimeoutInfo = {}; // Clear all recorded timeouts in order to can synchronise again (call count reset)
        }
        that._bSameTick = false;
      }, 0);
    }
  };

  /**
   * Log debug messages when debug mode is on.
   * @param {string} message
   */
  this._logDebugMessage = function(message) {
    if (this.debug === true) {
      /* eslint no-console: */
      console.debug(message);
    }
  };

  /**
   * Return message with all pending callbacks info.
   * @param {string} message
   * @param {Object[]} pendingExecutions
   * @return {string} message
   */
  this._getPendingCallbacksInfo = function(message, pendingExecutions) {
    if (pendingExecutions && pendingExecutions.length > 0) {
      message += '. Pending callbacks:';
      pendingExecutions.forEach(function (pendingExecution) {
        message += '\n\t.....ID: ' + pendingExecution.id;
        if (pendingExecution.func) {
          message += '\n\tFunc: ' + pendingExecution.func;
        }
        if (pendingExecution.delay) {
          message += '\n\tDelay: ' + pendingExecution.delay;
        }
        message += '\n\tStack: ' + pendingExecution.errStack;
      });

      // show all tracked timeouts
      message += '\n\t-----All tracked timeouts after the last successful synchronisation: ';
      for (var property in this.oTimeoutInfo) {
        if (this.oTimeoutInfo.hasOwnProperty(property)) {
          message += '\n\t+++++Hash: ' + property;
          message += '\n\tFunc: ' + this.oTimeoutInfo[property].func;
          message += '\n\tDelay: ' + this.oTimeoutInfo[property].delay;
          message += '\n\tCall count: ' + this.oTimeoutInfo[property].callCount;
          message += '\n\tStack: ' + this.oTimeoutInfo[property].errStack;
        }
      }
    }
    return message;
  };

  /**
   * Get function name.
   * @param {function} func
   * @return {string} function name
   */
  this._getFunctionName = function(func) {
    var functionName;
    if (func.name && typeof func.name == 'string') {
      functionName = func.name;
    } else {
      functionName = func.toString();
      functionName = functionName.substring('function'.length, functionName.indexOf('('));
    }
    return functionName.trim();
  };

  /**
   * Get timeout by timer id.
   * @param {Object[]} searchArray
   * @param {number} searchForId
   * @return {Object{}} the matched timeout in an array
   */
  this._getPendingExecutionById = function(searchArray, searchForId) {
    return searchArray.filter(function(item) {
      return item.id === searchForId;
    });
  };

  /**
   * Remove timeout from pending timeout list.
   * @param {number} id
   * @param {Object[]} aTrackedList
   * @return {boolean} if item is deleted
   */
  this._removeItemFromTracking = function(id, aTrackedList) {
    var isItemDeleted = false;
    var currentItemArr = this._getPendingExecutionById(aTrackedList, id);
    if (currentItemArr.length > 0) {
      aTrackedList.splice(aTrackedList.indexOf(currentItemArr[0]), 1);
      isItemDeleted = true;
    }
    return isItemDeleted;
  };

  /**
   * Add timeout to pending timeout list.
   * @param {Object} oPendingItem
   * @param {Object[]} aTrackedList
   */
  this._addItemForTracking = function(oPendingItem, aTrackedList) {
    aTrackedList.push(oPendingItem);
  };

  /**
   * Get stacktrace. Error().stack doesn't work for IE!
   * For IE the stack property is set to undefined when the error is constructed, and gets the trace information
   * when the error is raised.
   * @return {string} stack trace
   */
  this._resolveCurrentStackTrace = function() {
    try {
      throw new Error();
    } catch (err) {
      return err.stack;
    }
  };

  /**
   * Hash the timeout (call stack & delay are unique)
   * @param {string} errStack
   * @param {number} delay
   * @return {number} hashed timeout
   */
  this._hashTimeout = function(errStack, delay) {
    var hash = 0;

    for (var i = 0; i < errStack.length; i++) {
      var currentChar = errStack.charCodeAt(i);
      hash = ((hash << 5) - hash) + currentChar;
      hash = hash & hash; // Convert to 32bit integer
    }

    hash += delay;

    return hash;
  };

  this._wrapSetTimeout();
  this._wrapClearTimeout();
  this._wrapXHR();

};

module.exports = ClassicalWaitForUI5;
