function ActionInterceptor() {
  this.latestLocator = null;
}

ActionInterceptor.prototype.onSync = function (syncCb) {
  // hook in waiter (before actions)
  var originalWaitForUI5 = browser.waitForUI5;
  browser.waitForUI5 = function () {
    return originalWaitForUI5.apply(this, arguments).then(syncCb, syncCb);
  };
};

ActionInterceptor.prototype.onAction = function (actionCb) {
  var that = this;

  // hook in applyAction_ to get the element locator
  var applyAction_ = protractorModule.parent.exports.ElementArrayFinder.prototype.applyAction_;
  protractorModule.parent.exports.ElementArrayFinder.prototype.applyAction_ = function (applyActionCb) {
    var sLocator = this.locator().toString();
    var newApplyActionCb = function (webElem) {
      that.latestLocator = sLocator;
      return applyActionCb.call(this, webElem);
    };
    return applyAction_.call(this, newApplyActionCb);
  };

  // hook in webelement action to get action name and value
  ['click', 'sendKeys'].forEach(function (action) {
    var originalAction = protractorModule.parent.parent.exports.WebElement.prototype[action];
    protractorModule.parent.parent.exports.WebElement.prototype[action] = function () {
      var element = this;
      var actionValue = arguments[0];

      return element.getAttribute('id').then(function (elementId) {
        var promiseActionCb = function () {
          actionCb({
            element: element,
            elementLocator: that.latestLocator,
            elementId: elementId,
            name: action,
            value: actionValue
          });
        };
        return originalAction.call(element, actionValue).then(promiseActionCb, promiseActionCb);
      });
    };
  });
};

module.exports = new ActionInterceptor();
