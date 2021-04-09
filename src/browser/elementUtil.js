var element = require('../element/element');

/**
 * Mix a function from one object onto another. The function will still be
 * called in the context of the original object.  Any arguments of type
 * `ElementFinder` will be unwrapped to their underlying `WebElement` instance
 *
 * @private
 * @param {Object} to
 * @param {Object} from
 * @param {string} fnName
 * @param {function=} setupFn
 */
function mixin(to, from, fnName, setupFn) {
  to[fnName] = function () {
    var args = arguments;
    for (var i = 0; i < args.length; i++) {
      if (args[i] instanceof element.ElementFinder) {
        args[i] = args[i].getWebElement();
      }
    }
    var fnMixin = function () {
      return from[fnName].apply(from, args);
    };
    if (setupFn) {
      var setupResult = setupFn();
      if (setupResult && (typeof setupResult.then === 'function')) {
        return setupResult.then(fnMixin);
      }
    }
    return fnMixin();
  };
}

/**
 * Build the helper 'element' function for a given instance of Browser.
 *
 * @private
 * @param {Browser} browser A browser instance.
 * @returns {function(webdriver.Locator): element.ElementFinder}
 */
function buildElementHelper(browser) {
  var elementHelper = function (locator) {
    return new element.ElementArrayFinder(browser).all(locator).toElementFinder_();
  };
  elementHelper.all = function (locator) {
    return new element.ElementArrayFinder(browser).all(locator);
  };
  return elementHelper;
}

module.exports = {
  mixin: mixin,
  buildElementHelper: buildElementHelper
};
