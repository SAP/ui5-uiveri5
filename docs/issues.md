# Installation Issues

## npm shows errors mentioning node-gyp and PYTHON but tool is installed
### Short:
If overall installation status is successful, you can safely ignore them.
### Long:
UIVeri5 depends on some modules that themselves depend on native code-like BufferUtils.
During installation, npm calls node-gyp while it tries to build the native code to executable. This usually
fails because build tools line python and VC++ are not installed. Anyway, the native code is only optional and is used
to speed up the execution and all the relevant modules have pure js implementations. That's why the overall installation
succeeds and UIVeri5 works fine.

## npm shows errors mentioning node-gyp and PYTHON, tool is not installed
Some versions of npm have issues with failures in optional dependencies. So you could retry the installation by using the
'--no-optional' argument.

## npm shows error mentioning "code ECONNRESET"
If you have a proxy configuration but the proxy is not working for internet access you could get
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
Please ensure you have Git installed. Also, be sure to install Git for windows to run in the __regular command prompt__ also.
Make sure you have proxy configured for both Git and npm. You could copy the following commands to the proxy.bat file and execute
it in the same console before operations requiring public internet access from Git or npm.
``` Windows
REM configure git
set HTTP_PROXY=http://proxy:8080
set HTTPS_PROXY=http://proxy:8080
REM configure npm
npm config set proxy http://proxy:8080
npm config set https-proxy http://proxy:8080
```

## UIVeri5 fails with Java not found
UIVeri5 uses WebDriverJs and it could start selenium-server-standalone.jar for local use case. So, you either need Java so
that Selenium Standalone could run, or you need to run your test against a remote Selenium hub or a remote cloud provider.

# Configuration Issues

## Failed: Spec with full name: Spec name not found

For every `somefile.spec.js` file, the topmost `describe` call must have a string identifying the suite. This string **must** be the same as the name of the file, like so:

In file `somefile.spec.js`:
```js
describe("somefile", function () {
  it("runs some tests", function () {
    // ... test steps ...
  });
});
```
