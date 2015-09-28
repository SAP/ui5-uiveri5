
# Application testing

## Test organization

### Test Data
Extract all test content constants in a single test data object.

### Page Objects
Define all selectors in a hierarchical page objects.

## Selectors
Prefer hierarchical class selectors. Try to compose them the way you would explain to a human where to click.

### Avoid ID selectors
Selection a DOM element by ID is the simplest and widely used approach in classical web site testing.
The classical web page is composed manually and so the important elements are manually assigned nice
and meaningful IDs. So it is easy to identify those elements in automatic tests.
But in highly-dynamic JS frameworks like SAPUI5 the DOM is generated out of the views. The views could
also be generated from the content meta-information. Usually the ID of UI5 control contain the control
name and a suffix that is the sequential number of this type of control in this app. So the root element
of a view could have id like "__xmlview1".
There are several problems with using such generated IDs in application tests.
1. IDs are mostly static between application runs but they will definitely change when the application is modified.
Even minor unrelated change like adding one more button in some common area like header could cause a change of
all IDs. This will require changes in all selectors used in all tests for this application.
2. There are cases when the generated IDs will be different depending on the environment the application is running.
2. Generated IDs are totally not self-documenting and this makes the test harder to understand and maintain.

### Avoid non-visible attributes
Think from the point of view of the users. Users do not see DOM nodes and their attributes but see them rendered.
So write selectors that include only "visible" attributes.
This also makes the test much self-documenting and simplifies maintenance.

### Minimize use of attribute selectors

## Test code

###  WebDriver Element, promises and control flow

### Promises are resolved automatically
```javascript
// works but is too complicated
someElement.count().then(function (count) {
    expect(count).toBeGreaterThan(0);
  }
);

// better
expect(someElement.count()).toBeGreaterThan(0);
```

### Comparing a value before and after action
Sometimes you need to compare a value after an action with the same value before the action.
One way to achieve this is to resolve the value before and store it a local var.
Then execute the action and then resolve the same value again and compare the new value in the promise resolved
handler directly.
You could not compare the two values directly in an expectation outside the resolved handled as the
comparison will be executed immediately, where as the values will be resolved later.
You could also not compare a value and the element promise because the expectation comparison function will
'catch' the initial value of the primitive type var. So the comparison will happen in the correct time but
with outdated value.

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

