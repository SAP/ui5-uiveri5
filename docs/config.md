### Config file
Config file is a node module that exports a single 'config' object of type: 'src/visualtest.js/{Config}'
Config file could reference a profile that is another config file with name <profile>.profile.conf.js

### Command-line arguments
Command-line arguments override options from config file, config file overwrites options from profile config file,
profile overwrites build-in defaults.

If config file is not provided on command line, a file with name 'conf.js' is looked up in the current working directory.
If found, it is used. If not found, the default conf/default.conf.js file is used.

### Browser runtimes

Browser runtime is an object of type: 'src/runtimeResolver.js/{Runtime}' that specifies the browser and platform
on which to execute the test. You could specify only few of the properties of a runtime. The rest will be derived
if possible or wildcards will be assumed. For example, if platformName is omitted, the default for the specific browser
will be assumed. Like 'windows' for browser 'ie', 'mac' for browser 'safari', etc. If browserVersion or platformVersion
are not explicitly specified, wildcard will be assumed and test will run on any  available platform and browser versions.
[NOT IMPLEMENTED YET]Several browser runtimes could be specified and so the test will run in parallel on all of them.

Values and defaults:
* browserName - one of (chrome|firefox|ie|safari|edge), browser name, default: chrome
* browserVersion - browser version, default: *
* platformName - one of (windows|mac|linux|android|ios|winphone)} - platform name, default: windows
* platformVersion - platform number like 7,8 for windows; 4.4,5.0 for android;, default: *
* platformResolution - format: /\d+x\d+/- platform resolution, WIDTHxHEIGHT, default: resolved from available
* ui5.theme - one of (bluecrystal|hcp) - UI5 theme, default bluecrystal
* ui5.direction - one of (rtl|ltr) - UI5 direction, default: ltr
* ui5.mode - one of (cosy|compact) - UI5 mode, default: cosy

Specify in custom spec.js:
```javascript
browsers:[{
  browserName: 'chrome'
}]
```
Specify on command line in ':' -separated notation:
```
$ visualtest --browsers=ie:9
```
Runtime attributes are extracted sequentially in the order they are defined above.
Specify on command line in json format:
```
$ visualtest --browsers={"browserName":"chrome',"ui5":{"theme":"hcb"}}
```
Specify several browser runtimes:
```
$ visualtest --browsers=chrome,firefox
```

### Browser capabilities

Default browser capabilities could be provided in browserCapabilities for a browser and platform pair.
Those capabilities will be used by default when driving the specific browser. Both browser and platform fields
accept a comma-separated list of names, wildcard character '*'. Prepend the exclusion charatcter '!' in front
of the name to exclude this name from the match.
Those capabilities could be overwritten or extended in the browser runtime configuration.

Add default options to browser capabilities:
```javascript
browserCapabilities: {
  'chrome': {
    'windows': {
      chromeOptions: {
        args: ['start-maximized']
      }
    }
  }
}
```
or overwrite or extend in browser runtime:
```javascript
browsers: [{
  browserName: 'chrome',
  platformName: 'linux',
  capabilities: {
    chromeOptions: {
      args: ['start-maximized']
    }
  }
}]
```

### Passing params to test
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
Usage in tests
```
if('should check something',function(){
  if(browser.testrunner.config.params.someKey) {
    doSomethingWithThisValue(browser.testrunner.config.params.someKey);
  }
});
```

### Timeouts
Override default timeout values in config file:
``` javascript
timeouts: {
  getPageTimeout: '10000',
  allScriptsTimeout: '11000',
  defaultTimeoutInterval: '30000'
}
```
Please check [protractor timeouts](https://github.com/angular/protractor/blob/master/docs/timeouts.md)
for their meaning.

### Wait after initial page loading and forced reload
Some application testing usecases require immediate page reload after authentication. Or some wait period after initial
pageload so that some non-ui5 code to settle page state. Enable those features in config file:
```javascript
pageLoading: {
  wait: '20000',  // provided by default, remove when https://github.wdf.sap.corp/I035254/visualtestjs/issues/27 is done
  initialReload: false
}
```
