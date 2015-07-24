#### Config file
Config file is a node module that exports a single 'config' object of type: 'visualtes.js/Config'
Config file could specify a profile that is another config file with name <profile>.profile.conf.js

### Command-line arguments
Command-line arguments override options from config file, config file overwrites options from profile config file,
profile overwrites build-in defaults.

If config file is not provided on command line, a file with name 'conf.js' is looked up in the current working directory.
If found, it is used. If not found, the conf\default.conf.js file is used.

#### Common config file use-cases
* Run from visualtestjs agains local sapui5 server
  * command-line no conf -> no conf.js in cwd -> default.conf.js profile=visual -> visual.profile.conf.js -> build-in defaults

* Run visualtestjs with custom options
  * command-line conf=conf.js -> conf.js no profile -> visual.profile.conf.js -> build-in defaults

* Run integration tests
  * command-line no conf -> conf.js in cwd found -> profile=integration -> integration.profile.conf.js -> build-in defaults
  * command-line conf=conf.js -> conf.js profile=integration -> integration.profile.conf.js -> build-in defaults

### Browser capabilities
``` json
browsers: [{
  browserName: 'chrome',            // chrome, firefox, ie, safari
  browserVersion: '40',             // version or missing for latest available
  platformName: 'windows',          // windows,mac,linux,android,ios
  platformVersion: '8',             // like: 8,9,... for IE, 5.0,5.1,... for Android, ...
  platformResolution: '1024x768',   // defines also orientation
  ui5: {
    theme: <bluecrystal|hcp|...>
    direction: <rtl|ltr>
    mode: '<compact|cosy>'
  }
}]
```

```wiki
--browsers="chrome,ie,firefox"

--browsers=chrome
--browsers=ie
--browsers=firefox
```

parallel browsers in protractor:
http://www.ngroutes.com/questions/AUuAC2THa5vEqxqlK3lQ/e2e-testing-on-multiple-parallel-browsers-in-protractor.html

WebDriver capabilities
https://code.google.com/p/selenium/wiki/DesiredCapabilities
https://code.google.com/p/selenium/source/browse/javascript/webdriver/capabilities.js
https://www.browserstack.com/automate/capabilities
https://sites.google.com/a/chromium.org/chromedriver/capabilities

Handle certificates
http://stackoverflow.com/questions/24507078/how-to-deal-with-certificates-using-selenium
https://support.google.com/chrome/a/answer/187202
https://support.google.com/chrome/a/answer/2657289

### Params to be passed to test
Define in conf.js file
``` javascript
exports.config = {
  params: {
    someKey: someValue,
    anotherKey: {
     secondLevelKey: secondLevelValue
    }
  }
};
```
Override from command line or define new params
```
$ visualtest --params.someKey=redefineSomeValue --params.anotherKey.anotherSecondLevelKey=anotherSecondLevelValue
```
Use in tests
```
if('should check something',function(){
  if(browser.testrunner.config.params.someKey) {
    doSomethingWithThisValue(browser.testrunner.config.params.someKey);
  }
});
```
