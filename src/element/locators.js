/**
 * ==========================================================
 * Copied from protractor, with excluded angular-only locators
 * ==========================================================
 */
var selenium_webdriver = require('selenium-webdriver');

// Explicitly define webdriver.By.
// We do this because we want to inherit the static methods of webdriver.By, as opposed to
// inheriting from the webdriver.By class itself, which is actually analogous to ProtractorLocator.
var WebdriverBy = function () {
  this.className = selenium_webdriver.By.className;
  this.css = selenium_webdriver.By.css;
  this.id = selenium_webdriver.By.id;
  this.linkText = selenium_webdriver.By.linkText;
  this.js = selenium_webdriver.By.js;
  this.name = selenium_webdriver.By.name;
  this.partialLinkText = selenium_webdriver.By.partialLinkText;
  this.xpath = selenium_webdriver.By.xpath;
};

function isProtractorLocator(locator) {
  return locator && (typeof locator.findElementsOverride === 'function');
}

/**
 * The Protractor Locators
 *
 * @alias by
 * @extends {webdriver.By}
 */
var ProtractorBy = function () {
  WebdriverBy.call(this, arguments);
};

/**
 * Add a locator to this instance of ProtractorBy. This locator can then be
 * used with element(by.locatorName(args)).
 *
 * @view
 * <button ng-click='doAddition()'>Go!</button>
 *
 * @example
 * // Add the custom locator.
 * by.addLocator('buttonTextSimple',
 *     function(buttonText, opt_parentElement, opt_rootSelector) {
 *   // This function will be serialized as a string and will execute in the
 *   // browser. The first argument is the text for the button. The second
 *   // argument is the parent element, if any.
 *   var using = opt_parentElement || document,
 *       buttons = using.querySelectorAll('button');
 *
 *   // Return an array of buttons with the text.
 *   return Array.prototype.filter.call(buttons, function(button) {
 *     return button.textContent === buttonText;
 *   });
 * });
 *
 * // Use the custom locator.
 * element(by.buttonTextSimple('Go!')).click();
 *
 * @alias by.addLocator(locatorName, functionOrScript)
 * @param {string} name The name of the new locator.
 * @param {Function|string} script A script to be run in the context of
 *     the browser. This script will be passed an array of arguments
 *     that contains any args passed into the locator followed by the
 *     element scoping the search and the css selector for the root angular
 *     element. It should return an array of elements.
 */
ProtractorBy.prototype.addLocator = function (name, script) {
  this[name] = () => {
    var locatorArguments = arguments;
    return {
      findElementsOverride: function (driver, using, rootSelector) {
        var findElementArguments = [script];
        for (var i = 0; i < locatorArguments.length; i++) {
          findElementArguments.push(locatorArguments[i]);
        }
        findElementArguments.push(using);
        findElementArguments.push(rootSelector);
        return driver.findElements(selenium_webdriver.By.js.apply(selenium_webdriver.By, findElementArguments));
      },
      toString: function () {
        return 'by.' + name + '("' + Array.prototype.join.call(locatorArguments, '", "') + '")';
      }
    };
  };
};

/**
 * Find an element by css selector within the Shadow DOM.
 *
 * @alias by.deepCss(selector)
 * @view
 * <div>
 *   <span id='outerspan'>
 *   <'shadow tree'>
 *     <span id='span1'></span>
 *     <'shadow tree'>
 *       <span id='span2'></span>
 *     </>
 *   </>
 * </div>
 * @example
 * var spans = element.all(by.deepCss('span'));
 * expect(spans.count()).toEqual(3);
 *
 * @param {string} selector a css selector within the Shadow DOM.
 * @returns {Locator} location strategy
 */
ProtractorBy.prototype.deepCss = function (selector) {
  // TODO(julie): syntax will change from /deep/ to >>> at some point.
  // When that is supported, switch it here.
  return selenium_webdriver.By.css('* /deep/ ' + selector);
};

module.exports = {
  WebdriverBy: WebdriverBy,
  isProtractorLocator: isProtractorLocator,
  ProtractorBy: ProtractorBy
};
