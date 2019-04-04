# Writing Expectations

## Jasmine and WebDriverJs
All standard Jasmine matchers are available as described in [matchers](https://jasmine.github.io/2.8/introduction). WebDriverJs interactions are adapted and promises are resolved, so there's no need to resolve the promises manually.
```javascript
// promises are resolved automatically
expect(browser.getTitle()).toBe('Master-Detail');

// use manual promise resolving when you want to reach the value itself
browser.getTitle().then(function(title) {
  console.log('Page title is: ' + title);
  expect(title).toBe('Master-Detail');
});
```

## Using Control Properties
You can get the properties of the control correspoding to an element by using the `asControl` method. The elements can be retrieved using any locator and each single `ElementFinder` of the result can be used to verify control properties.

Under the hood, the method searches for the closest parent, which is a control root element, and looks up its properties. This approach can be more convenient and readable than searching for inner elements, which usually have generated IDs, or searching by a list of class names. Also, some properties may not lead to a new element child rendering but still be valuable for testing. `asControl` becomes even more valuable when used alongside control locators.

Example usage:
```javascript
var header = element(by.control({
  viewName: "myView",
  controlType: "sap.m.ObjectHeader"
}));
expect(header.asControl().getProperty("title")).toBe("Title");
// alternatively search through the DOM subtree of the control root element, if the property is visually represented via some child element
expect(header.element(by.className("sapMOHTitleDiv")).getText()).toBe("Title");
```

## Comparing a Value Before and After Action
Sometimes, you need to compare a value after an action to the same value before the action.
One way to achieve this is to resolve the value before and store it a local var.
Then, execute the action and resolve the same value again to compare the new value in the promise resolved
handler directly.

You can't compare the two values directly in an expectation outside the resolved handler because the
comparison is executed immediately and the values are resolved later.

You also can't compare a value to the element promise because the expectation comparison function 
catches the initial value of the primitive type var in its scope, causing the comparison to happen in the correct time but
using an outdated value.

```javascript
if('compare two values',function(){
  var valueBefore;
  element(by.css('input')).getText().then(function(value){
    valueBefore = value;
  });

  element(by.css('button').click();

  element(by.css('input')).getText().then(function(valueAfter){
    expect(valueBefore).toBe(valueAfter);
  });
});
```
