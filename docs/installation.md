### Prerequisites
visualtesjs requires nodejs >=0.12 and java>=1.6

### Installation

#### Install globally
* Install latest version of visualtest globally:
```
$ npm install git://github.wdf.sap.corp/I035254/visualtestjs.git#v1.3.0 -g --no-optional
```
The --no-optional flag is necessary to avoid the installation of some optional dependencies (buffer-utils) that
require native build that itself requires PYTHON and VC++.
* Download selenium jar and browser drivers:
```
$ visualtest-webdriver update
```

### Issues

#### npm show errors mentioning node-gy and PYTHON
##### Short:
If overal installation status is success, you could safely ignore them.
##### Long:
visualtestjs depends on some modules that themselves depend on native code like bufferutils.
During installation npm calls node-gyp that tries to build the native code to executable. But this usually
fails because build tools line python and VC++ are not installed. Anyway, the native code is only optional and is used
to speedup the execution and all the relevant modules have pure js implementations. Thats why the overall installation
succeeds and visualtestjs works fine.

#### npm show errors mentioning node-gyp and PYTHON, tool is not installed
Some versions of npm have issues with failures in optional dependencies. So you could retry the installation with
'--no-optional' argument.

#### npm downloads dependecies really slow and fails randomly with git errors
Please ensure you have git installed. Be sure to install Git for windows to run in the __regular command prompt__ also.
Make sure you have proxy configured for both git and npm. You could copy the following commands to proxy.bat and execute
it in the same console before operations requiring public internet access from git or npm.
```
REM configure git
set HTTP_PROXY=http://proxy:8080
set HTTPS_PROXY=http://proxy:8080

REM configure npm
npm config set proxy http://proxy:8080
npm config set https-proxy http://proxy:8080
```

#### visualtest fails with java not found
Visualtest uses webdriverjs and it starts selenium-server-standalone.jar for local usecase. So you either need java so
that selenium standalone could run or you need to run your test against remote selenium hub or remote cloud provider.
