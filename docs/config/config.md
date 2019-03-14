# Configuration

## Config file
Config file is a node module that exports a single 'config' object.
Config file could reference a profile that contains a meaningfull defaults for this usecase. If missing, the default profile 'integration' is used. 
Available profiles are:
* integration - default profile for e2e tests
* visual - profile for visual tests

If config file is not provided on command line, a file with name 'conf.js' is looked up in the current working directory.
If found, it is used. If not found, the default conf/default.conf.js file is used.

## Command-line arguments
Command-line arguments override options from config file. 
Check how to specify them in [Command-line arguments](console.md)

## Browsers
Browser runtime is an object that specifies the browser and platform on which to execute the test. 
You could specify only few of the properties of a runtime. The rest will be derived if possible or wildcards will be assumed. 

Values and defaults:
* browserName - one of (chrome|firefox|ie|safari|edge), browser name, default: chrome
* browserVersion - browser version, default: *
* platformName - one of (windows|mac|linux|android|ios|winphone)} - platform name, default: windows
* platformVersion - platform number like 7,8 for windows; 4.4,5.0 for android;, default: *
* platformResolution - format: /\d+x\d+/- platform resolution, WIDTHxHEIGHT, default: resolved from available
* ui5.theme - one of (bluecrystal|belize|hcp) - UI5 theme, default belize
* ui5.direction - one of (rtl|ltr) - UI5 direction, default: ltr
* ui5.mode - one of (cosy|compact) - UI5 mode, default: cosy

Specify in conf.js:
```javascript
browsers:[{
  browserName: 'chrome'
}]
```

Specify on command line in ':' -separated notation:
```
$ uiveri5 --browsers=ie:11
```
Runtime attributes are extracted sequentially in the order they are defined above.


Specify chrome mobile emulator:
```
$ uiveri5 --browsers=chromeMobileEmulation
```
This will start yor deskyop chrome with mobile emulation (default screen confoiguration is matching “Samsung Galaxy S7”).

Specify chrome headless:
```
$ uiveri5 --browsers=chromeHeadless
```

## Execution

### Local execution
By default, UIveri5 will download the latest webdriver and start a local browser directly.
It is possible to start selenium webdriver to control the local webdriver with setting _useSeleniumJar_ parameter to true.
Automatically resolved free port will be used for the locally started webdriver and it could be overwritten by _seleniumPort_ configuration.

### Remote execution
If _seleniumAddress_ is provided (either in conf.js or on command line) uiveri5 will connect to this address.
The remote connection could use http proxy server specified in _seleniumAddressProxy_.

#### Timeout starting webdriver
In some specific network cases(e.g. multi homed machines), starting webdriver locally may fail with a timeout. The timeout is caused by the fact that selenium by default binds to first/primary IP. But if the machine has several IPs like in the case of active VPN, the webdriver may wrongly try to connect to some of the other adresses and never succeeds. The workaround for this case is to set the _seleniumLoopback_ parameter to _true_.

## Drivers
Each browser requires a specific native webdriver. Webdrivers configuration is documented in [Drivers](drivers.md)

## Parameters 
Parameters are used in the tests scripts. Check how to use them in [Parameters](parameters.md)

## Authentication
UIveri5 support authentication for accessing the test pages with declarative configuration. The most common authentication scenarious like SAP Cloud, SAP IDM and Fiori Launchpad are support out of the box. Custom authentication schemes are also supported. For advanced setups, programatic authentication is also supported.
Check how to configure authentication in [Authentication](authentication.md)

## Reporters
Test execution results can be summarized in a report. We support several report formats, e.g. JUnit, JSON, HTML. The config file defines the reporters to use and their options.
Check how to configure reports in [Reporters](reporters.md)

## Timeouts
Override default timeout values in config file:
```javascript
timeouts: {
  getPageTimeout: '10000',
  allScriptsTimeout: '11000',
  defaultTimeoutInterval: '30000'
}
```

Override timeouts from command-line:
```
--timeouts.defaultTmeoutInterval=50000
```
Please check [protractor timeouts](https://github.com/angular/protractor/blob/master/docs/timeouts.md)
for their meaning.

## Run against android emulator
Start appium
```
$ appium --device-name=android
```
Execute the visual test
```
$ uiveri5 --browsers=browser:*:android --seleniumAddress=http://127.0.0.1:4723/wd/hub --baseUrl=http://10.0.2.2:8080
```

