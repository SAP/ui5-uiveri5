# Installation issues

## npm show errors mentioning node-gyp and PYTHON but tool is installed
### Short:
If overall installation status is success, you could safely ignore them.
### Long:
uiveri5 depends on some modules that themselves depend on native code like bufferutils.
During installation npm calls node-gyp that tries to build the native code to executable. But this usually
fails because build tools line python and VC++ are not installed. Anyway, the native code is only optional and is used
to speedup the execution and all the relevant modules have pure js implementations. Thats why the overall installation
succeeds and uiveri5 works fine.

## npm show errors mentioning node-gyp and PYTHON, tool is not installed
Some versions of npm have issues with failures in optional dependencies. So you could retry the installation with
'--no-optional' argument.

## npm shows error mentioning "code ECONNRESET"
If your have a proxy configuration but the proxy is not working for internet access you could get
a network error similar to: "network tunneling socket could not be established, cause=connect ECONNREFUSED <ip>:<port>
where <ip> and <port> are the ones of your proxy. To solve it, just remove your proxy settings.
``` Windows
REM configure git
set HTTP_PROXY=
set HTTPS_PROXY=
REM configure npm
npm config delete proxy
npm config delete https-proxy
```

## npm downloads dependecies really slow and fails randomly with git errors
Please ensure you have git installed. Be sure to install Git for windows to run in the __regular command prompt__ also.
Make sure you have proxy configured for both git and npm. You could copy the following commands to proxy.bat and execute
it in the same console before operations requiring public internet access from git or npm.
``` Windows
REM configure git
set HTTP_PROXY=http://proxy:8080
set HTTPS_PROXY=http://proxy:8080
REM configure npm
npm config set proxy http://proxy:8080
npm config set https-proxy http://proxy:8080
```

## uieri5 fails with java not found
uiveri5 uses webdriverjs and it starts selenium-server-standalone.jar for local usecase. So you either need java so
that selenium standalone could run or you need to run your test against remote selenium hub or remote cloud provider.
