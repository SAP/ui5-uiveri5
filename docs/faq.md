
## Executing test
### Start browser maximized:
Add options to browser capabilities:
```json
  browsers: [{
    browserName: 'chrome',
    chromeOptions: {
      args: ['start-maximized']
    }}
  ]
```
or in test:
```javascript
browser.driver.manage().window().maximize()
```

## Writing tests

### Basic requirements
Only one describe() block
No browser.get()

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
