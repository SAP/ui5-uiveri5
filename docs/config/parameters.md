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

## Importing Parameters from a File
The configuration can point to a JSON file that contains test parameters.
All data in the file will be made available in `browser.testrunner.config.params`.
Any command-line parameters with matching names will take priority over the ones imported from the file.
```
$ uiveri5 --paramsFile="./param.json"
```
param.json before test start:
```json
{
  "some_param": "some value"
}
```
```javascript
if('should check something', function () {
  expect(browser.testrunner.config.params.some_param).toBe("some value);
});
```

## Exporting Parameters to a File
The configuration can point to a JSON file where test parameters will be exported after all tests complete.
```
$ uiveri5 --exportParamsFile="./exportParam.json"
```
```javascript
if('should do something', function () {
  browser.testrunner.config.exportParams.some_param = "some value derived during the test";
  expect(Object.keys(browser.testrunner.config.exportParams).length).toBe(1);
});
```
exportParam.json after test completed:
```json
{
  "some_param": "some value derived during the test"
}
```
