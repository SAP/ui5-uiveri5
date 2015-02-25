# visualtestjs

## Usage 

### Visual testing

### Run from openui5
Clone and install dependencies for openui5:
```
git clone https://github.com/SAP/openui5.git
npm install
```
Run all tests against automatically started server:
```
grunt visualtest
```

### Run from visualtestjs
Install visualtest globally:
```
npm install git://github.wdf.sap.corp/maximnaidenov/visualtestjs.git -g
```
Run all tests against already running server at localhost:8080:
```
visualtestjs
```

### Integration testing

Install visualtest globally:
```
npm install git://github.wdf.sap.corp/maximnaidenov/visualtestjs.git -g
```
Create a folder for your integration tests, place them inside and create a conf.js file:
```
exports.config = {
  specs: ['MMR.spec.js']
};
```
Run all tests from the folder that contains conf.js
```
visualtestjs
```

### Advanced options

By default visualtest will discover all `**/visualtes/**.spec.js` from localhost:8080 and execute them on local chrome over automatically started selenium server on localhost:4444.
All of the above defaults could be modified by providing command-line arguments.

Run tests on Chrome, Firefox and InternetExplorer in parallel 
```
--browsers="chrome,firefox,iexplorer" 
```
Run tests on remote sapui5 runtime
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
Run tests on remote provider (sauselabs, browsetstack, ..) on a particular platform and brouser
```
--browsers="chrome:android4.4" --remote="sause:api.sauselabs.com:443:<user>:<token>" 
```

Command-line arguments override options from conf.js
