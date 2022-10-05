# Configuration
There are three main levels of configuraton, from highest to lowest priority:
* command line arguments
* project config file
* default configuration for the built-in profile, declared in the project config file
If there are properties with the same name or ID on two config levels:
* primitive values from the config with higher priority overrides other values
* arrays from both configs are merged

## Config File
Config file is a node module that exports a single `config` object.
Config file could reference a profile that contains meaningful defaults for this usecase. If missing, the default `integration` profile is used.

Available profiles are:
* integration - default profile for E2E tests
* visual - profile for visual tests
* api - profile for API tests

`profile` can also point to a file. The configuration in the referred file will have a lower priority.
Profiles will be applied recursively from the referred file, its own profile reference and so on.
Note that the paths will be relative to the UIVeri5 module. Use absolute paths for your project directory:
```javascript
exports.config = {
  profile: path.join(__dirname, 'base/config.js'),
  baseUrl: 'http://localhost:8080/'
}
```

If config file is not provided on command line, a file with name `conf.js` is looked up in the current working directory.
If found, it is used, otherwise the default conf/default.conf.js file is used.

## Command-line Arguments
Command-line arguments override options from the config file. 
For more information on how to specify them, see [Command-line arguments](console.md).

## Browsers
Browser runtime is an object that specifies the browser and platform on which to execute the test. 
You can specify only a few of the properties of a runtime. The rest are derived if possible or wildcards are assumed.

Values and defaults:
* browserName - one of (chrome|firefox|ie|safari|edge), browser name, default: chrome
* browserVersion - browser version, default: *
* platformName - one of (windows|mac|linux|android|ios|winphone)} - platform name, default: windows
* platformVersion - platform number like 7,8 for windows; 4.4,5.0 for android;, default: *
* platformResolution - format: /\d+x\d+/- platform resolution, WIDTHxHEIGHT, default: resolved from available
* ui5.theme - one of (bluecrystal|belize|fiori_3|fiori_3_dark|horizon) - UI5 theme, default belize
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
$ uiveri5 --browsers=chrome::::::fiori_3
$ uiveri5 --browsers=chrome:::::::rtl
$ uiveri5 --browsers=chrome::::::::compact
```
Runtime attributes are extracted sequentially in the order they are defined above.

Specify chrome mobile emulator:
```
$ uiveri5 --browsers=chromeMobileEmulation
```
This starts your desktop chrome with mobile emulation (default screen configuration is matching “Samsung Galaxy S7”).

Specify chrome headless:
```
$ uiveri5 --browsers=chromeHeadless
```

## Execution

### Local Execution
By default, UIveri5 downloads the latest WebDriver and starts a local browser directly.
It is possible to start Selenium jar WebDriver to control the local WebDriver with setting `useSeleniumJar` parameter to `true`.
Automatically resolved free port is used for the locally started WebDriver and it can be overwritten by the `seleniumPort` configuration.

### Remote Execution
If `seleniumAddress` is provided (either in conf.js or on command line), UIVeri5 connects to this address.
The remote connection could use HTTP proxy server specified in `seleniumAddressProxy`.

#### Timeout Starting WebDriver
In some specific network cases (e.g. multi homed machines), starting WebDriver locally may fail with a timeout. The timeout is caused by the fact that Selenium binds to first/primary IP by default. But if the machine has several IPs, such as in the case of active VPN, the WebDriver may incorrectly try to connect to some of the other adresses and never succeed. The workaround for this case is to set the `seleniumLoopback` parameter to `true`.

## Drivers
Each browser requires a specific native WebDriver. For more information on configuring WebDriver, see [Drivers](drivers.md).

## Parameters 
Parameters are used in the test scripts. For more information on how to use them, see [Parameters](parameters.md).

## Authentication
UIveri5 support authentication for accessing the test pages with declarative configuration. The most common authentication scenarious, such as SAP Cloud, SAP IDM and SAP Fiori Launchpad are supported out of the box. Custom authentication schemes are also supported. For advanced setups, programatic authentication is also supported. For more information, see [Authentication](authentication.md).

## Reporters
Test execution results can be summarized in a report. We support several report formats, such as JUnit, JSON, and HTML. The config file defines the reporters to use and their options. For more information, see [Reporters](reporters.md).

## Timeouts
Override default timeout values in the config file:
```javascript
timeouts: {
  getPageTimeout: '10000',
  allScriptsTimeout: '11000',
  defaultTimeoutInterval: '30000'
}
```

Override timeouts from the command-line:
```
--timeouts.defaultTimeoutInterval=50000
```
Please check [protractor timeouts](https://github.com/angular/protractor/blob/master/docs/timeouts.md)
for their meaning.

## Run Against an Android Emulator
Start appium:
```
$ appium --device-name=android
```
Execute the visual test:
```
$ uiveri5 --browsers=browser:*:android --seleniumAddress=http://127.0.0.1:4723/wd/hub --baseUrl=http://10.0.2.2:8080
```

