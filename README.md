# visualtestjs

## Usage

### Visual testing

### Run from openui5 - NOT implemented
Clone and install dependencies for openui5:
```
$ git clone https://github.com/SAP/openui5.git
$ npm install
```
Run all tests against automatically started local server:
```
$ grunt visualtest
```

### Integration testing
Install visualtest globally:
```
$ npm install git://github.wdf.sap.corp/maximnaidenov/visualtestjs.git -g
```
Create a folder for your integration tests, place them inside and create a conf.js file:
```
exports.config = {
  profile: 'integration'
};
```
Run all *.spec.js tests from the folder that contains conf.js. Make sure that root suite is named as spec file name.
```
$ visualtestjs
```

### Run visualtests of locally cloned openui5 with sample [tests](https://git.wdf.sap.corp/#/c/826745/)
Install openui5 locally:
```
$ git clone ssh://<user>@git.wdf.sap.corp:29418/openui5
$ cd openui5
$ npm install
```
Pull sample test from draft commit:
```
$ git pull ssh://<user>@git.wdf.sap.corp:29418/openui5 refs/changes/45/826745/2
```
Install visualtestjs locally:
```
$ git clone git://github.wdf.sap.corp/maximnaidenov/visualtestjs.git
$ npm install
```
Start openui5 server:
```
$ cd openui5
$ grunt serve
```
Run all tests against the locally running server:
```
$ cd visualtestjs
$ npm run visualtest -- --verbose --ignoreSync
```

### Advanced options - NOT implemented yet

By default visualtest will discover all `**/visualtest/**.spec.js` from localhost:8080 and execute them on local chrome over automatically started selenium server on localhost:4444.
All of the above defaults could be modified by providing command-line arguments.

Run tests on Chrome, Firefox and InternetExplorer in parallel
__not implemented__
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

### Run unit tests
```
$ npm run test
```
