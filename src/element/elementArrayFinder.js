/**
 * ==========================================================
 * Copied from protractor, with excluded angular-only methods and added UI5-related methods
 * ==========================================================
 */
var selenium_webdriver = require('selenium-webdriver');
var locators = require('./locators');
var WEB_ELEMENT_FUNCTIONS = require('./elementFunctions').webElementFunctions;

/**
 * ElementArrayFinder is used for operations on an array of elements (as opposed
 * to a single element).
 *
 * The ElementArrayFinder is used to set up a chain of conditions that identify
 * an array of elements. In particular, you can call all(locator) and
 * filter(filterFn) to return a new ElementArrayFinder modified by the
 * conditions, and you can call get(index) to return a single ElementFinder at
 * position 'index'.
 *
 * Similar to jquery, ElementArrayFinder will search all branches of the DOM
 * to find the elements that satisfy the conditions (i.e. all, filter, get).
 * However, an ElementArrayFinder will not actually retrieve the elements until
 * an action is called, which means it can be set up in helper files (i.e.
 * page objects) before the page is available, and reused as the page changes.
 *
 * You can treat an ElementArrayFinder as an array of WebElements for most
 * purposes, in particular, you may perform actions (i.e. click, getText) on
 * them as you would an array of WebElements. The action will apply to
 * every element identified by the ElementArrayFinder. ElementArrayFinder
 * extends Promise, and once an action is performed on an ElementArrayFinder,
 * the latest result can be accessed using then, and will be returned as an
 * array of the results; the array has length equal to the length of the
 * elements found by the ElementArrayFinder and each result represents the
 * result of performing the action on the element. Unlike a WebElement, an
 * ElementArrayFinder will wait for the UI5 app to settle before
 * performing finds or actions.
 *
 * @alias element.all(locator)
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * element.all(by.css('.items li')).then(function(items) {
 *   expect(items.length).toBe(3);
 *   expect(items[0].getText()).toBe('First');
 * });
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * $$('.items li').then(function(items) {
 *   expect(items.length).toBe(3);
 *   expect(items[0].getText()).toBe('First');
 * });
 *
 * @constructor
 * @param {ProtractorBrowser} browser A browser instance.
 * @param {function(): Array.<webdriver.WebElement>} getWebElements A function
 *    that returns a list of the underlying Web Elements.
 * @param {webdriver.Locator} locator The most relevant locator. It is only
 *    used for error reporting and ElementArrayFinder.locator.
 * @param {Array.<webdriver.promise.Promise>} opt_actionResults An array
 *    of promises which will be retrieved with then. Resolves to the latest
 *    action result, or null if no action has been called.
 * @returns {ElementArrayFinder}
 */
var ElementArrayFinder = function (browser_, getWebElements, locator_, actionResults_) {
  this.browser_ = browser_;
  this.getWebElements = getWebElements || null;
  this.locator_ = locator_;
  this.actionResults_ = actionResults_ || null;

  WEB_ELEMENT_FUNCTIONS.forEach(function (fnName) {
    this[fnName] = function () {
      var args = arguments;
      var element = this;
      var actionFn = function (webElem) {
          return webElem[fnName].apply(webElem, args);
      };

      // TODO fix
      // if (['click', 'sendKeys'].indexOf(fnName) > -1) {
      //   return element.getAttribute('id').then(function (elementId) {
      //     var onActionCb = function () {
      //       browser_.plugins_.onElementAction({
      //         element: element,
      //         elementLocator: element.locator_.toString(),
      //         elementId: elementId,
      //         name: fnName,
      //         value: args[0]
      //       });
      //     }
      //     return this.applyAction_(actionFn).then(onActionCb, onActionCb);
      //   }.bind(this), function (e) {
      //     console.log("=========== hi 3", e);
      //   });
      // } else {
        return this.applyAction_(actionFn);
      // }
    }.bind(this);
  }.bind(this));
};

/**
 * Create a shallow copy of ElementArrayFinder.
 *
 * @returns {!ElementArrayFinder} A shallow copy of this.
 */
ElementArrayFinder.prototype.clone = function () {
  // A shallow copy is all we need since the underlying fields can never be
  // modified. (Locator can be modified by the user, but that should
  // rarely/never happen and it doesn't affect functionalities).
  return new ElementArrayFinder(this.browser_, this.getWebElements, this.locator_, this.actionResults_);
};

/**
 * Calls to ElementArrayFinder may be chained to find an array of elements
 * using the current elements in this ElementArrayFinder as the starting
 * point. This function returns a new ElementArrayFinder which would contain
 * the children elements found (and could also be empty).
 *
 * @alias element.all(locator).all(locator)
 * @view
 * <div id='id1' class="parent">
 *   <ul>
 *     <li class="foo">1a</li>
 *     <li class="baz">1b</li>
 *   </ul>
 * </div>
 * <div id='id2' class="parent">
 *   <ul>
 *     <li class="foo">2a</li>
 *     <li class="bar">2b</li>
 *   </ul>
 * </div>
 *
 * @example
 * let foo = element.all(by.css('.parent')).all(by.css('.foo'));
 * expect(foo.getText()).toEqual(['1a', '2a']);
 * let baz = element.all(by.css('.parent')).all(by.css('.baz'));
 * expect(baz.getText()).toEqual(['1b']);
 * let nonexistent = element.all(by.css('.parent'))
 *   .all(by.css('.NONEXISTENT'));
 * expect(nonexistent.getText()).toEqual(['']);
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let foo = $$('.parent').$$('.foo');
 * expect(foo.getText()).toEqual(['1a', '2a']);
 * let baz = $$('.parent').$$('.baz');
 * expect(baz.getText()).toEqual(['1b']);
 * let nonexistent = $$('.parent').$$('.NONEXISTENT');
 * expect(nonexistent.getText()).toEqual(['']);
 *
 * @param {webdriver.Locator} subLocator
 * @returns {ElementArrayFinder}
 */
ElementArrayFinder.prototype.all = function (locator) {
  var getWebElementsWithWait = function () {
    if (this.getWebElements === null) {
      // This is the first time we are looking for an element
      return this.browser_.waitForUI5('Locator: ' + locator)
        .then(function () {
          if (locators.isProtractorLocator(locator)) {
            return locator.findElementsOverride(this.browser_.driver, null, this.browser_.rootEl);
          } else {
            return this.browser_.driver.findElements(locator);
          }
        }.bind(this));
    } else {
      return this.getWebElements().then(function (parentWebElements) {
        // For each parent web element, find their children and construct
        // a list of Promise<List<child_web_element>>
        var childrenPromiseList = parentWebElements.map(function (parentWebElement) {
          return locators.isProtractorLocator(locator) ?
            locator.findElementsOverride(this.browser_.driver, parentWebElement, this.browser_.rootEl) :
            parentWebElement.findElements(locator);
        }.bind(this));
        // Resolve the list of Promise<List<child_web_elements>> and merge
        // into a single list
        return selenium_webdriver.promise.all(childrenPromiseList)
          .then(function (resolved) {
            return resolved.reduce(function (childrenList, resolvedE) {
              return childrenList.concat(resolvedE);
            }.bind(this), []);
          }.bind(this));
      }.bind(this));
    }
  }.bind(this);
  return new ElementArrayFinder(this.browser_, getWebElementsWithWait, locator);
};

/**
 * Apply a filter function to each element within the ElementArrayFinder.
 * Returns a new ElementArrayFinder with all elements that pass the filter
 * function. The filter function receives the ElementFinder as the first
 * argument and the index as a second arg. This does not actually retrieve
 * the underlying list of elements, so it can be used in page objects.
 *
 * @alias element.all(locator).filter(filterFn)
 * @view
 * <ul class="items">
 *   <li class="one">First</li>
 *   <li class="two">Second</li>
 *   <li class="three">Third</li>
 * </ul>
 *
 * @example
 * element.all(by.css('.items li')).filter(function(elem, index) {
 *   return elem.getText().then(function(text) {
 *     return text === 'Third';
 *   });
 * }).first().click();
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * $$('.items li').filter(function(elem, index) {
 *   return elem.getText().then(function(text) {
 *     return text === 'Third';
 *   });
 * }).first().click();
 *
 * @param {function(ElementFinder, number): webdriver.WebElement.Promise}
 * filterFn
 *     Filter function that will test if an element should be returned.
 *     filterFn can either return a boolean or a promise that resolves to a
 * boolean
 * @returns {!ElementArrayFinder} A ElementArrayFinder that represents an
 * array
 *     of element that satisfy the filter function.
 */
ElementArrayFinder.prototype.filter = function (filterFn) {
  var getWebElements = function () {
    return this.getWebElements().then(function (parentWebElements) {
      var list = parentWebElements.map(function (parentWebElement, index) {
        var ElementFinder = require('./elementFinder');
        var elementFinder = ElementFinder.fromWebElement_(this.browser_, parentWebElement, this.locator_);
        return filterFn(elementFinder, index);
      }.bind(this));
      return selenium_webdriver.promise.all(list).then(function (resolvedList) {
        return parentWebElements.filter(function (parentWebElement, index) {
          return resolvedList[index];
        }.bind(this));
      }.bind(this));
    });
  }.bind(this);
  return new ElementArrayFinder(this.browser_, getWebElements, this.locator_);
};

/**
 * Get an element within the ElementArrayFinder by index. The index starts at 0.
 * Negative indices are wrapped (i.e. -i means ith element from last)
 * This does not actually retrieve the underlying element.
 *
 * @alias element.all(locator).get(index)
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * let list = element.all(by.css('.items li'));
 * expect(list.get(0).getText()).toBe('First');
 * expect(list.get(1).getText()).toBe('Second');
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let list = $$('.items li');
 * expect(list.get(0).getText()).toBe('First');
 * expect(list.get(1).getText()).toBe('Second');
 *
 * @param {number|webdriver.promise.Promise} index Element index.
 * @returns {ElementFinder} finder representing element at the given index.
 */
ElementArrayFinder.prototype.get = function (index) {
  var getWebElements = function () {
    return selenium_webdriver.promise.all([index, this.getWebElements()]).then(function ([i, parentWebElements]) {
      if (i < 0) {
        i += parentWebElements.length;
      }
      if (i < 0 || i >= parentWebElements.length) {
        throw new selenium_webdriver.error.NoSuchElementError('Index out of bound. Trying to access element at index: ' + index +
            ', but there are only ' + parentWebElements.length + ' elements that match ' +
            'locator ' + this.locator_.toString());
      }
      return [parentWebElements[i]];
    }.bind(this));
  }.bind(this);
  return new ElementArrayFinder(this.browser_, getWebElements, this.locator_).toElementFinder_();
};

/**
 * Get the first matching element for the ElementArrayFinder. This does not
 * actually retrieve the underlying element.
 *
 * @alias element.all(locator).first()
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * let first = element.all(by.css('.items li')).first();
 * expect(first.getText()).toBe('First');
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let first = $$('.items li').first();
 * expect(first.getText()).toBe('First');
 *
 * @returns {ElementFinder} finder representing the first matching element
 */
ElementArrayFinder.prototype.first = function () {
  return this.get(0);
};

/**
 * Get the last matching element for the ElementArrayFinder. This does not
 * actually retrieve the underlying element.
 *
 * @alias element.all(locator).last()
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * let last = element.all(by.css('.items li')).last();
 * expect(last.getText()).toBe('Third');
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let last = $$('.items li').last();
 * expect(last.getText()).toBe('Third');
 *
 * @returns {ElementFinder} finder representing the last matching element
 */
ElementArrayFinder.prototype.last = function () {
  return this.get(-1);
};

/**
 * Shorthand function for finding arrays of elements by css.
 * `element.all(by.css('.abc'))` is equivalent to `$$('.abc')`
 *
 * @alias $$(cssSelector)
 * @view
 * <div class="count">
 *   <span class="one">First</span>
 *   <span class="two">Second</span>
 * </div>
 *
 * @example
 * // The following two blocks of code are equivalent.
 * let list = element.all(by.css('.count span'));
 * expect(list.count()).toBe(2);
 * expect(list.get(0).getText()).toBe('First');
 * expect(list.get(1).getText()).toBe('Second');
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let list = $$('.count span');
 * expect(list.count()).toBe(2);
 * expect(list.get(0).getText()).toBe('First');
 * expect(list.get(1).getText()).toBe('Second');
 *
 * @param {string} selector a css selector
 * @returns {ElementArrayFinder} which identifies the
 *     array of the located {@link webdriver.WebElement}s.
 */
ElementArrayFinder.prototype.$$ = function (selector) {
  return this.all(selenium_webdriver.By.css(selector));
};

/**
 * Returns an ElementFinder representation of ElementArrayFinder. It ensures
 * that the ElementArrayFinder resolves to one and only one underlying
 * element.
 *
 * @returns {ElementFinder} An ElementFinder representation
 * @private
 */
ElementArrayFinder.prototype.toElementFinder_ = function () {
  var ElementFinder = require('./elementFinder');
  return new ElementFinder(this.browser_, this);
};

/**
 * Count the number of elements represented by the ElementArrayFinder.
 *
 * @alias element.all(locator).count()
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * let list = element.all(by.css('.items li'));
 * expect(list.count()).toBe(3);
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let list = $$('.items li');
 * expect(list.count()).toBe(3);
 *
 * @returns {!webdriver.promise.Promise} A promise which resolves to the
 *     number of elements matching the locator.
 */
ElementArrayFinder.prototype.count = function () {
  return this.getWebElements().then(function (arr) {
    return arr.length;
  }).catch(function (err) {
    if (err instanceof selenium_webdriver.error.NoSuchElementError) {
      return 0;
    } else {
      throw err;
    }
  });
};

/**
 * Returns true if there are any elements present that match the finder.
 *
 * @alias element.all(locator).isPresent()
 *
 * @example
 * expect($('.item').isPresent()).toBeTruthy();
 *
 * @returns {Promise<boolean>}
 */
ElementArrayFinder.prototype.isPresent = function () {
  return this.count().then(function (count) {
    return count > 0;
  });
};

/**
 * Returns the most relevant locator.
 *
 * @example
 * // returns by.css('#ID1')
 * $('#ID1').locator();
 *
 * // returns by.css('#ID2')
 * $('#ID1').$('#ID2').locator();
 *
 * // returns by.css('#ID1')
 * $$('#ID1').filter(filterFn).get(0).click().locator();
 *
 * @returns {webdriver.Locator}
 */
ElementArrayFinder.prototype.locator = function () {
  return this.locator_;
};

/**
 * Apply an action function to every element in the ElementArrayFinder,
 * and return a new ElementArrayFinder that contains the results of the
 * actions.
 *
 * @param {function(ElementFinder)} actionFn
 *
 * @returns {ElementArrayFinder}
 * @private
 */
ElementArrayFinder.prototype.applyAction_ = function (actionFn) {
  var callerError = new Error();
  var actionResults = this.getWebElements()
    .then(function (arr) {
      return selenium_webdriver.promise.all(arr.map(actionFn));
    })
    .then(function (value) {
      return {
        passed: true,
        value: value
      };
    }).catch(function (error) {
      return {
        passed: false,
        value: error
      };
    });
  var actionGetWebElements = function () {
    return actionResults.then(function () {
      return this.getWebElements();
    }.bind(this));
  }.bind(this);

  var actionResultsWithError = actionResults.then(function (result) {
    if (result.passed) {
      return result.value;
    } else {
      var noSuchErr;
      if (result.value instanceof Error) {
        noSuchErr = result.value;
        noSuchErr.stack = noSuchErr.stack + callerError.stack;
      } else {
        noSuchErr = new Error(result.value);
        noSuchErr.stack = callerError.stack;
      }
      throw noSuchErr;
    }
  });

  return new ElementArrayFinder(this.browser_, actionGetWebElements, this.locator_, actionResultsWithError);
};

/**
 * Represents the ElementArrayFinder as an array of ElementFinders.
 *
 * @returns {Array.<ElementFinder>} Return a promise, which resolves to a list of ElementFinders specified by the locator.
 */
ElementArrayFinder.prototype.asElementFinders_ = function () {
  var ElementFinder = require('./elementFinder');
  return this.getWebElements().then(function (arr) {
    return arr.map(function (webElem) {
      return ElementFinder.fromWebElement_(this.browser_, webElem, this.locator_);
    }.bind(this));
  }.bind(this));
};

/**
 * Retrieve the elements represented by the ElementArrayFinder. The input
 * function is passed to the resulting promise, which resolves to an
 * array of ElementFinders.
 *
 * @alias element.all(locator).then(thenFunction)
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * element.all(by.css('.items li')).then(function(arr) {
 *   expect(arr.length).toEqual(3);
 * });
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * $$('.items li').then(function(arr) {
 *   expect(arr.length).toEqual(3);
 * });
 *
 * @param {function(Array.<ElementFinder>)} fn
 * @param {function(Error)} errorFn
 *
 * @returns {!webdriver.promise.Promise} A promise which will resolve to
 *     an array of ElementFinders represented by the ElementArrayFinder.
 */
ElementArrayFinder.prototype.then = function (fn, errorFn) {
  if (this.actionResults_) {
    return this.actionResults_.then(fn, errorFn);
  }
  else {
    return this.asElementFinders_().then(fn, errorFn);
  }
};

/**
 * Calls the input function on each ElementFinder represented by the
 * ElementArrayFinder.
 *
 * @alias element.all(locator).each(eachFunction)
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * element.all(by.css('.items li')).each(function(element, index) {
 *   // Will print 0 First, 1 Second, 2 Third.
 *   element.getText().then(function (text) {
 *     console.log(index, text);
 *   });
 * });
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * $$('.items li').each(function(element, index) {
 *   // Will print 0 First, 1 Second, 2 Third.
 *   element.getText().then(function (text) {
 *     console.log(index, text);
 *   });
 * });
 *
 * @param {function(ElementFinder)} fn Input function
 *
 * @returns {!webdriver.promise.Promise} A promise that will resolve when the
 *     function has been called on all the ElementFinders. The promise will
 *     resolve to null.
 */
ElementArrayFinder.prototype.each = function (fn) {
  return this.map(fn).then(function () {
    return null;
  });
};

/**
 * Apply a map function to each element within the ElementArrayFinder. The
 * callback receives the ElementFinder as the first argument and the index as
 * a second arg.
 *
 * @alias element.all(locator).map(mapFunction)
 * @view
 * <ul class="items">
 *   <li class="one">First</li>
 *   <li class="two">Second</li>
 *   <li class="three">Third</li>
 * </ul>
 *
 * @example
 * let items = element.all(by.css('.items li')).map(function(elm, index) {
 *   return {
 *     index: index,
 *     text: elm.getText(),
 *     class: elm.getAttribute('class')
 *   };
 * });
 * expect(items).toEqual([
 *   {index: 0, text: 'First', class: 'one'},
 *   {index: 1, text: 'Second', class: 'two'},
 *   {index: 2, text: 'Third', class: 'three'}
 * ]);
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let items = $$('.items li').map(function(elm, index) {
 *   return {
 *     index: index,
 *     text: elm.getText(),
 *     class: elm.getAttribute('class')
 *   };
 * });
 * expect(items).toEqual([
 *   {index: 0, text: 'First', class: 'one'},
 *   {index: 1, text: 'Second', class: 'two'},
 *   {index: 2, text: 'Third', class: 'three'}
 * ]);
 *
 * @param {function(ElementFinder, number)} mapFn Map function that
 *     will be applied to each element.
 * @returns {!webdriver.promise.Promise} A promise that resolves to an array
 *     of values returned by the map function.
 */
ElementArrayFinder.prototype.map = function (mapFn) {
  return this.asElementFinders_().then(function (arr) {
    var list = arr.map(function (elementFinder, index) {
      var mapResult = mapFn(elementFinder, index);
      // All nested arrays and objects will also be fully resolved.
      return selenium_webdriver.promise.fullyResolved(mapResult);
    }.bind(this));
    return selenium_webdriver.promise.all(list);
  }.bind(this));
};

/**
 * Apply a reduce function against an accumulator and every element found
 * using the locator (from left-to-right). The reduce function has to reduce
 * every element into a single value (the accumulator). Returns promise of
 * the accumulator. The reduce function receives the accumulator, current
 * ElementFinder, the index, and the entire array of ElementFinders,
 * respectively.
 *
 * @alias element.all(locator).reduce(reduceFn)
 * @view
 * <ul class="items">
 *   <li class="one">First</li>
 *   <li class="two">Second</li>
 *   <li class="three">Third</li>
 * </ul>
 *
 * @example
 * let value = element.all(by.css('.items li')).reduce(function(acc, elem) {
 *   return elem.getText().then(function(text) {
 *     return acc + text + ' ';
 *   });
 * }, '');
 *
 * expect(value).toEqual('First Second Third ');
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * let value = $$('.items li').reduce(function(acc, elem) {
 *   return elem.getText().then(function(text) {
 *     return acc + text + ' ';
 *   });
 * }, '');
 *
 * expect(value).toEqual('First Second Third ');
 *
 * @param {function(number, ElementFinder, number, Array.<ElementFinder>)}
 *     reduceFn Reduce function that reduces every element into a single
 * value.
 * @param {*} initialValue Initial value of the accumulator.
 * @returns {!webdriver.promise.Promise} A promise that resolves to the final
 *     value of the accumulator.
 */
ElementArrayFinder.prototype.reduce = function (reduceFn, initialValue) {
  var valuePromise = selenium_webdriver.promise.when(initialValue);
  return this.asElementFinders_().then(function (arr) {
    return arr.reduce(function (valuePromise, elementFinder, index) {
      return valuePromise.then(function (value) {
        return reduceFn(value, elementFinder, index, arr);
      });
    }, valuePromise);
  }.bind(this));
};

module.exports = ElementArrayFinder;
