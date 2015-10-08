# visualtestjs

## Usage

### Visual testing

### Run visual tests for openui5
* Pull grunt support and sample tests from this draft commit:
```
$ git pull ssh://<user>@git.wdf.sap.corp:29418/openui5 refs/changes/45/826745/6
```
* Update dependencies so latest visualtestjs is used:
```
$ npm update visualtestjs
```
* Run all available tests:
```
$ grunt visualtest
```
Please check [developing.md](https://github.com/SAP/openui5/blob/master/docs/developing.md) and
[tools.md](https://github.com/SAP/openui5/blob/master/docs/tools.md) for further command-line arguments that
visualtest grunt task accepts. Please check [controllibraries.md](https://github.com/SAP/openui5/blob/master/docs/controllibraries.md)
and [visualtesting.md](docs/visualtesting.md) how to write visual tests.
Please use the sample visual tests from the draft commit above for reference.

### Run visual tests for ui5-contributor project
* Please follow the procedure [install globally](docs/installation.md).
* Create a conf.js file in the root of your project with the following content:
```
exports.config = {
  profile: 'visual'
};
```
To store the reference images outside the source tree, check [config.md](docs/config.md)
* Start your server
* Run all available tests:
```
$ visualtest
```
### Integration testing
* Please follow the procedure [install globally](docs/installation.md).
* Create a folder for your integration tests, place them inside and create a conf.js file:
```
exports.config = {
  profile: 'integration'
};
```
* Run all *.spec.js tests from the folder that contains conf.js. Make sure that root suite is named as spec file name.
```
$ visualtest
```

### Advanced options

By default visualtest will discover all applicable visual tests and execute them on local chrome
against over automatically started selenium server on localhost:4444.
All of the defaults could be modified either in conf.js or by providing command-line arguments.

* Run tests on different browser
```
--browsers=firefox
```
* Run tests on Chrome, Firefox and InternetExplorer in parallel __not implemented__
```
--browsers=chrome,firefox,ie
```
* Run tests against test content on remote sapui5 runtime
```
--baseUrl="http://veui5infra.dhcp.wdf.sap.corp:8080"
```
* Run tests on remove selenium server
```
--seleniumAddress="myAirBook.wdf.sap.corp:4444/wd/hub"
```
* Run tests on remote selenium grid server that dispatches the test job to particular OS/Browser slave
```
--browsers="ie:9:windows:8"
--browsers="chrome:*:windows"
--browsers="{browserName:'ie',browserVersion:9,platformName:'windows',platformVersion'8'}" --seleniumAddress="ui5testgrid.wdf.sap.corp:4444/wd/hub"
```
*Run tests over remote connection (sauselabs, browserstack, ..)
__not implemented__
```
--browsers="chrome:*:android:4.4" --connection="sauselabs:<user>:<token>:<url>:<further params>"
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


