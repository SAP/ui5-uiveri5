# visualtestjs

## Usage

### Visual testing

### Run from openui5
Clone and install dependencies for openui5:
```
$ git clone https://github.com/SAP/openui5.git
$ npm install
```
Pull grunt support and sample tests from this draft commit:
```
$ git pull ssh://<user>@git.wdf.sap.corp:29418/openui5 refs/changes/45/826745/6
```
Update dependencies so latest visualtestjs is used:
```
$ npm update visualtestjs
```
Run all available tests:
```
$ grunt visualtest
```
Please check [developing.md](https://github.com/SAP/openui5/blob/master/docs/developing.md) and
[tools.md](https://github.com/SAP/openui5/blob/master/docs/tools.md) for further command-line arguments that
visualtest grunt task accepts. Please check [controllibraries.md](https://github.com/SAP/openui5/blob/master/docs/controllibraries.md)
and the available sap.m library visual tests from the draft commit above how to write new visual tests.

### Integration testing
Install visualtest globally:
```
$ npm install git://github.wdf.sap.corp/I035254/visualtestjs.git#v1.0.0 -g
```
If you face errors from node-gyp with the above installation, try with: --no-optional argument
Download selenium jar and drivers:
```
$ visualtest-webdriver update
```

Create a folder for your integration tests, place them inside and create a conf.js file:
```
exports.config = {
  profile: 'integration'
};
```
Run all *.spec.js tests from the folder that contains conf.js. Make sure that root suite is named as spec file name.
```
$ visualtest
```

### Advanced options - NOT ALL are implemented yet

By default visualtest will discover all `**/visualtest/**.spec.js` from localhost:8080 and execute them on local chrome over automatically started selenium server on localhost:4444.
All of the above defaults could be modified by providing command-line arguments.

Run tests on Chrome, Firefox and InternetExplorer in parallel
__still works with single browser only__
```
--browsers="chrome,firefox,ie"
```
Run tests from and against test content on remote sapui5 runtime
```
--baseUrl="http://veui5infra.dhcp.wdf.sap.corp:8080"
```
Run tests on remove selenium server
```
--seleniumAddress="myAirBook.wdf.sap.corp:4444/wd/hub"
```
Run tests on remote selenium grid server that dispatches the test job to particular OS/Browser slave
__not implemented__
```
--browsers="ie:9:windows:8"
--browsers="chrome:*:windows"
--browsers="{browserName:'ie',browserVersion:9,platformName:'windows',platformVersion'8'}" --seleniumAddress="ui5testgrid.wdf.sap.corp:4444/wd/hub"
```
Run tests on remote provider (sauselabs, browserstack, ..) on a particular platform and browser
__not implemented__
```
--browsers="{browserName:chrome,platformName:android,platformVersion:'4.4'}" --remote="sause:api.sauselabs.com:443:<user>:<token>"
```

## Development

### Run unit tests from visualtestjs project
```
$ npm run test
```
### Run unit tests for grunt integration from openui5 project
```
$jasmine-node grunt/spec/selenium_visualtest.spec.js
```


