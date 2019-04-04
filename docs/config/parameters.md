# Paramaters 
Parameters are used in the test scripts.

## Passing Params to Test
Define in conf.js file:
```javascript
exports.config = {
  params: {
    someKey: someValue,
    anotherKey: {
     secondLevelKey: secondLevelValue
    }
  }
};
```

Override from command line or define new params:
```
$ uiveri5 --params.someKey=redefineSomeValue --params.anotherKey.anotherSecondLevelKey=anotherSecondLevelValue
```

## Using Paramaters in Test
```javascript
if('should check something',function(){
  if(browser.testrunner.config.params.someKey) {
    doSomethingWithThisValue(browser.testrunner.config.params.someKey);
  }
});
```
