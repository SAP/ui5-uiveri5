# visualtestjs

## Usage

### Visual testing

### Run from openui5 - NOT implemented
Clone and install dependencies for openui5:
```
git clone https://github.com/SAP/openui5.git
npm install
```
Run all tests against automatically started local server:
```
grunt visualtest
```

### Integration testing
Install visualtest globally:
```
npm install git://github.wdf.sap.corp/maximnaidenov/visualtestjs.git -g
```
Create a folder for your integration tests, place them inside and create a conf.js file:
```
exports.config = {
  profile: 'integration'
};
```
Run all *.spec.js tests from the folder that contains conf.js. Make sure that root suite is named as spec file name.
```
visualtestjs
```

### Run visualtests of locally cloned openui5
Install openui5 locally:
```
git clone ssh://<user>@git.wdf.sap.corp:29418/openui5
cd openui5
npm install
```
Pull sample test from draft commit:
```
git pull ssh://<user>@git.wdf.sap.corp:29418/openui5 refs/changes/45/826745/1
```
Install visualtestjs locally:
```
git clone git://github.wdf.sap.corp/maximnaidenov/visualtestjs.git
npm install
```
Start openui5 server:
```
cd openui5
grunt serve
```
Run all tests against the locally running server:
```
cd visualtestjs
node bin/visualtest --verbose=true conf/nexttoopenui5.conf.js
```

### Advanced options - NOT implemented yet

By default visualtest will discover all `**/visualtest/**.spec.js` from localhost:8080 and execute them on local chrome over automatically started selenium server on localhost:4444.
All of the above defaults could be modified by providing command-line arguments.

Run tests on Chrome, Firefox and InternetExplorer in parallel
```
--browsers="chrome,firefox,iexplorer"
```
Run tests from and against test content on remote sapui5 runtime
```
--server="http://veui5infra.dhcp.wdf.sap.corp:8080"
```
Run tests on remove selenium server
```
--browsers="safari" --remote="myAirBook.wdf.sap.corp:4444"
```
Run tests on remote selenium grid server that dispatches the test job to particular OS/Browser slave
```
--browsers="iexplorer:ie9:win8" --remote="ui5testgrid.wdf.sap.corp:4444"
```
Run tests on remote provider (sauselabs, browserstack, ..) on a particular platform and browser
```
--browsers="chrome:android4.4" --remote="sause:api.sauselabs.com:443:<user>:<token>"
```

Command-line arguments override options from conf.js

command-line no conf -> default.conf.js profile=visual -> visualtest.profile.conf.js -> defaults
command-line conf=conf.js -> conf.js no profile -> visual.profile.conf.js -> defaults
command-line conf=conf.js -> conf.js profile=integration -> integration.profile.conf.js -> defaults


