/**
 * ==========================================================
 * Copied from protractor, with excluded angular-only methods,
 * and with additional methods specific to UI5
 * ==========================================================
 */
var selenium_webdriver = require('selenium-webdriver');
var logger = require('../logger');
var util = require('./util');
var ElementArrayFinder = require('./elementArrayFinder');
var ControlAPI = require('./controlAPI');
var WEB_ELEMENT_FUNCTIONS = require('./elementFunctions').webElementFunctions;

/**
 * The ElementFinder simply represents a single element of an
 * ElementArrayFinder (and is more like a convenience object). As a result,
 * anything that can be done with an ElementFinder, can also be done using
 * an ElementArrayFinder.
 *
 * The ElementFinder can be treated as a WebElement for most purposes, in
 * particular, you may perform actions (i.e. click, getText) on them as you
 * would a WebElement. Once an action is performed on an ElementFinder, the
 * latest result from the chain can be accessed using the then method.
 * Unlike a WebElement, an ElementFinder will wait for angular to settle before
 * performing finds or actions.
 *
 * ElementFinder can be used to build a chain of locators that is used to find
 * an element. An ElementFinder does not actually attempt to find the element
 * until an action is called, which means they can be set up in helper files
 * before the page is available.
 *
 * @alias element(locator)
 * @view
 * <span>{{person.name}}</span>
 * <span ng-bind="person.email"></span>
 * <input type="text" ng-model="person.name"/>
 *
 * @example
 * // Find element with {{scopelet}} syntax.
 * element(by.binding('person.name')).getText().then(function(name) {
 *   expect(name).toBe('Foo');
 * });
 *
 * // Find element with ng-bind="scopelet" syntax.
 * expect(element(by.binding('person.email')).getText()).toBe('foo@bar.com');
 *
 * // Find by model.
 * let input = element(by.model('person.name'));
 * input.sendKeys('123');
 * expect(input.getAttribute('value')).toBe('Foo123');
 *
 * @constructor
 * @extends {webdriver.WebElement}
 * @param {ProtractorBrowser} browser_ A browser instance.
 * @param {ElementArrayFinder} elementArrayFinder The ElementArrayFinder
 *     that this is branched from.
 * @returns {ElementFinder}
 */
var ElementFinder = function (browser_, elementArrayFinder) {
  this.browser_ = browser_;
  this.then = null;
  if (!elementArrayFinder) {
    throw new Error('BUG: elementArrayFinder cannot be empty');
  }
  this.parentElementArrayFinder = elementArrayFinder;

  // Only have a `then` method if the parent element array finder
  // has action results.
  if (this.parentElementArrayFinder.actionResults_) {
    // Access the underlying actionResult of ElementFinder.
    this.then = function (fn, errorFn) {
      return this.elementArrayFinder_.then(function (actionResults) {
        if (!fn) {
          return actionResults[0];
        }
        return fn(actionResults[0]);
      }, errorFn);
    }.bind(this);
  }

  // This filter verifies that there is only 1 element returned by the
  // elementArrayFinder. It will warn if there are more than 1 element and
  // throw an error if there are no elements.
  var getWebElements = function () {
    return elementArrayFinder.getWebElements().then(function (webElements) {
      if (webElements.length === 0) {
        throw new selenium_webdriver.error.NoSuchElementError('No element found using locator: ' + elementArrayFinder.locator().toString());
      } else if (webElements.length > 1) {
        logger.info('more than one element found for locator ' +
          elementArrayFinder.locator().toString() + ' - the first result will be used');
      }
      return [webElements[0]];
    }.bind(this));
  };

  // Store a copy of the underlying elementArrayFinder, but with the more
  // restrictive getWebElements (which checks that there is only 1 element).
  this.elementArrayFinder_ = new ElementArrayFinder(this.browser_, getWebElements, elementArrayFinder.locator(), elementArrayFinder.actionResults_);
  WEB_ELEMENT_FUNCTIONS.forEach(function (fnName) {
    this[fnName] = function () {
      return this.elementArrayFinder_[fnName].apply(this.elementArrayFinder_, arguments).toElementFinder_();
    }.bind(this);
  }.bind(this));
};

ElementFinder.fromWebElement_ = function (browser, webElem, locator) {
  var getWebElements = function () {
    return selenium_webdriver.promise.when([webElem]);
  };
  return new ElementArrayFinder(browser, getWebElements, locator).toElementFinder_();
};

/**
 * Create a shallow copy of ElementFinder.
 *
 * @returns {!ElementFinder} A shallow copy of this.
 */
ElementFinder.prototype.clone = function () {
  // A shallow copy is all we need since the underlying fields can never be modified
  return new ElementFinder(this.browser_, this.parentElementArrayFinder);
};

/**
 * @see ElementArrayFinder.prototype.locator
 *
 * @returns {webdriver.Locator}
 */
ElementFinder.prototype.locator = function () {
  return this.elementArrayFinder_.locator();
};

/**
 * Returns the WebElement represented by this ElementFinder.
 * Throws the WebDriver error if the element doesn't exist.
 *
 * @alias element(locator).getWebElement()
 * @view
 * <div class="parent">
 *   some text
 * </div>
 *
 * @example
 * // The following four expressions are equivalent.
 * $('.parent').getWebElement();
 * element(by.css('.parent')).getWebElement();
 * browser.driver.findElement(by.css('.parent'));
 * browser.findElement(by.css('.parent'));
 *
 * @returns {webdriver.WebElementPromise}
 */
ElementFinder.prototype.getWebElement = function () {
  var id = this.elementArrayFinder_.getWebElements().then(function (parentWebElements) {
    return parentWebElements[0];
  });
  return new selenium_webdriver.WebElementPromise(this.browser_.driver, id);
};

/**
 * Calls to {@code all} may be chained to find an array of elements within a
 * parent.
 *
 * @alias element(locator).all(locator)
 * @view
 * <div class="parent">
 *   <ul>
 *     <li class="one">First</li>
 *     <li class="two">Second</li>
 *     <li class="three">Third</li>
 *   </ul>
 * </div>
 *
 * @example
 * let items = element(by.css('.parent')).all(by.tagName('li'));
 *
 * // Or using the shortcut $() notation instead of element(by.css()):
 *
 * let items = $('.parent').all(by.tagName('li'));
 *
 * @param {webdriver.Locator} subLocator
 * @returns {ElementArrayFinder}
 */
ElementFinder.prototype.all = function (subLocator) {
  return this.elementArrayFinder_.all(subLocator);
};

/**
 * Calls to {@code element} may be chained to find elements within a parent.
 *
 * @alias element(locator).element(locator)
 * @view
 * <div class="parent">
 *   <div class="child">
 *     Child text
 *     <div>{{person.phone}}</div>
 *   </div>
 * </div>
 *
 * @example
 * // Chain 2 element calls.
 * let child = element(by.css('.parent')).
 *     element(by.css('.child'));
 * expect(child.getText()).toBe('Child text\n555-123-4567');
 *
 * // Chain 3 element calls.
 * let triple = element(by.css('.parent')).
 *     element(by.css('.child')).
 *     element(by.binding('person.phone'));
 * expect(triple.getText()).toBe('555-123-4567');
 *
 * // Or using the shortcut $() notation instead of element(by.css()):
 *
 * // Chain 2 element calls.
 * let child = $('.parent').$('.child');
 * expect(child.getText()).toBe('Child text\n555-123-4567');
 *
 * // Chain 3 element calls.
 * let triple = $('.parent').$('.child').
 *     element(by.binding('person.phone'));
 * expect(triple.getText()).toBe('555-123-4567');
 *
 * @param {webdriver.Locator} subLocator
 * @returns {ElementFinder}
 */
ElementFinder.prototype.element = function (subLocator) {
  return this.all(subLocator).toElementFinder_();
};

/**
 * Calls to {@code $$} may be chained to find an array of elements within a
 * parent.
 *
 * @alias element(locator).all(selector)
 * @view
 * <div class="parent">
 *   <ul>
 *     <li class="one">First</li>
 *     <li class="two">Second</li>
 *     <li class="three">Third</li>
 *   </ul>
 * </div>
 *
 * @example
 * let items = element(by.css('.parent')).$$('li');
 *
 * // Or using the shortcut $() notation instead of element(by.css()):
 *
 * let items = $('.parent').$$('li');
 *
 * @param {string} selector a css selector
 * @returns {ElementArrayFinder}
 */
ElementFinder.prototype.$$ = function (selector) {
  return this.all(selenium_webdriver.By.css(selector));
};

/**
 * Calls to {@code $} may be chained to find elements within a parent.
 *
 * @alias element(locator).$(selector)
 * @view
 * <div class="parent">
 *   <div class="child">
 *     Child text
 *     <div>{{person.phone}}</div>
 *   </div>
 * </div>
 *
 * @example
 * // Chain 2 element calls.
 * let child = element(by.css('.parent')).
 *     $('.child');
 * expect(child.getText()).toBe('Child text\n555-123-4567');
 *
 * // Chain 3 element calls.
 * let triple = element(by.css('.parent')).
 *     $('.child').
 *     element(by.binding('person.phone'));
 * expect(triple.getText()).toBe('555-123-4567');
 *
 * // Or using the shortcut $() notation instead of element(by.css()):
 *
 * // Chain 2 element calls.
 * let child = $('.parent').$('.child');
 * expect(child.getText()).toBe('Child text\n555-123-4567');
 *
 * // Chain 3 element calls.
 * let triple = $('.parent').$('.child').
 *     element(by.binding('person.phone'));
 * expect(triple.getText()).toBe('555-123-4567');
 *
 * @param {string} selector A css selector
 * @returns {ElementFinder}
 */
ElementFinder.prototype.$ = function (selector) {
  return this.element(selenium_webdriver.By.css(selector));
};

/**
 * Determine whether the element is present on the page.
 *
 * @view
 * <span>{{person.name}}</span>
 *
 * @example
 * // Element exists.
 * expect(element(by.binding('person.name')).isPresent()).toBe(true);
 *
 * // Element not present.
 * expect(element(by.binding('notPresent')).isPresent()).toBe(false);
 *
 * @returns {webdriver.promise.Promise<boolean>} which resolves to whether
 *     the element is present on the page.
 */
ElementFinder.prototype.isPresent = function () {
  return this.parentElementArrayFinder.getWebElements().then(function (arr) {
    if (arr.length === 0) {
      return false;
    }
    return arr[0].isEnabled().then(function () {
      return true; // is present, whether it is enabled or not
    }, util.falseIfMissing);
  }, util.falseIfMissing);
};

/**
 * Same as ElementFinder.isPresent(), except this checks whether the element
 * identified by the subLocator is present, rather than the current element
 * finder, i.e.: `element(by.css('#abc')).element(by.css('#def')).isPresent()`
 * is identical to `element(by.css('#abc')).isElementPresent(by.css('#def'))`.
 *
 * // Or using the shortcut $() notation instead of element(by.css()):
 *
 * `$('#abc').$('#def').isPresent()` is identical to
 * `$('#abc').isElementPresent($('#def'))`.
 *
 * @see ElementFinder.isPresent
 *
 * @param {webdriver.Locator} subLocator Locator for element to look for.
 * @returns {webdriver.promise.Promise<boolean>} which resolves to whether
 *     the subelement is present on the page.
 */
ElementFinder.prototype.isElementPresent = function (subLocator) {
  if (!subLocator) {
    throw new Error('SubLocator is not supplied as a parameter to ' +
        '`isElementPresent(subLocator)`. You are probably looking for the ' +
        'function `isPresent()`.');
  }
  return this.element(subLocator).isPresent();
};

/**
 * Compares an element to this one for equality.
 *
 * @param {!ElementFinder|!webdriver.WebElement} The element to compare to.
 *
 * @returns {!webdriver.promise.Promise.<boolean>} A promise that will be
 *     resolved to whether the two WebElements are equal.
 */
ElementFinder.prototype.equals = function (element) {
  var elementToCompareTo = element.getWebElement ? element.getWebElement() : element;
  return selenium_webdriver.WebElement.equals(this.getWebElement(), elementToCompareTo);
};

/**
 * =================
 * UI5-specific code
 * =================
 */

ElementFinder.prototype.asControl = function () {
  return new ControlAPI(this.elementArrayFinder_);
};

module.exports = ElementFinder;
