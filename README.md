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
$ git pull ssh://<user>@git.wdf.sap.corp:29418/openui5 refs/changes/45/826745/3
```
Update dependencies so latest visualtestjs is used:
```
$ npm update visualtestjs
```
Run all available tests:
```
$ grunt visualtest
```
Please check docs/developing.md and docs/tools.md for further arguments that visualtest task accepts.
Please check docs/controllibraries.md and the availbe sap.m libirary visual tests from the draft commit how to write new visual tests.

### Integration testing
Install visualtest globally:
```
$ npm install git://github.wdf.sap.corp/maximnaidenov/visualtestjs.git -g
```
Download selenium jar and drivers:
```
$ node %USERPROFILE%\AppData\Roaming\npm\node_modules\visualtestjs\node_modules\protractor\bin\webdriver-manager
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

### Advanced options - NOT implemented yet

By default visualtest will discover all `**/visualtest/**.spec.js` from localhost:8080 and execute them on local chrome over automatically started selenium server on localhost:4444.
All of the above defaults could be modified by providing command-line arguments.

Run tests on Chrome, Firefox and InternetExplorer in parallel
__still works with single browser only__
```
--browsers="chrome,firefox,iexplorer"
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
--browsers="iexplorer:ie9:win8" --seleniumAddress="ui5testgrid.wdf.sap.corp:4444/wd/hub"
```
Run tests on remote provider (sauselabs, browserstack, ..) on a particular platform and browser
__not implemented__
```
--browsers="chrome:android4.4" --remote="sause:api.sauselabs.com:443:<user>:<token>"
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


