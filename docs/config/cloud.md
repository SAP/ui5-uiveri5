# SauceLabs
SauceLabs is a popular browser cloud provider where you can spin a large variaty of browsers.
UIVeri5 uses a predefined naming scheme for runtimes that does not match completely with the naming scheme of [SauceLabs generic capabilities](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/)
But is it very easy to override any capability or add arbitrary new ones.

* ci-conf.js
```js
exports.config = {
  profile: 'integration',

  baseUrl: '<App URL>',

  // open the browser on SauceLabs cloud
  seleniumAddress: "https://<user>:<key>@ondemand.eu-central-1.saucelabs.com:443/wd/hub",

  browsers: [{
    // here you define the runtime according UIVeri5 naming scheme
    browserName: "edge",
    platformName: "windows",
    capabilities: {
      // and here you can override with SauceLabs specific names
      "platform": "Windows 10",
      "browserName": "MicrosoftEdge"
      // or may add any other capability
    }
  }]
};
```

Some additional [SauceLabs specific capabilities](https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options) you may need:
* parentTunnel - specify the name of the parrent SauceLabs tunnel that allaws access to internal network
* tunnelIdentifier - specify the identifier of specific SauceLabs tunnel instance
* timeZone - the timezone for the browser instance, you may need it if your tests depend on a timezone-specific date/time, example: "Berlin"
* screenResolution - the screen resolution, you may need it with responsive app and assumptions for the screen size in the tests, example: "1280x1024"
* maxDuration - max duration of the whole test suite execution in seconds, default is 30min. Could be extended to 10800sec = 3hours for extremely long tests.
* idleTimeout - max duration for a single interaction. This is the time that the application needs to process the longest interaction like a navigation after a click. Default is 90sec and could be extended to 600sec for extremely slow
applications.

## Identify test result

If you want to set a name, tags or CI build number for your test, you can do so in the browser capabilities:
```js
exports.config = {
  browsers: [{
    capabilities: {
      // here you can add details for your saucelabs test execution
      name: "my-test",
      tags: ["UIVeri5"],
      build: process.env.BUILD_NUMBER
    }
  }]
};
```

## Test annotations
SauceLabs gives you the option to annotate tests and make their execution logs more comrehensive.
UIVeri5 has a SauceLabs reporter that adds a default set of annotations - spec names, actions, expectation results, suite result, etc. Please note that SauceLabs reporter depends on SauceLabs environment and so will break if running with plain browser. 

So you need to active it conditionally only when you use SauceLabs. Define the SAUCELABS environment variable before starting the test.
```js
var reporters = [];
if (process.env.SAUCELABS) {
  reporters.push({
    {name: './reporter/saucelabsReporter'}
  })
}

exports.config = {
  reporters: reporters  
}
```

Another way is to add the SauceLabs reporter only in the CI/CD pipeline.

Using the confKeys syntax. Be careful to add at the first empty index so that you do not overwrite already existing reporter.
```
$ uiveri5 --confKeys=reporters[1].name:"./reporter/saucelabsReporter";
```

Or using the json format. Be careful to apply the correct escaping for your runtime.
```
$ uiveri5 --config={"reporters":[{"name":"./reporter/saucelabsReporter"}]}
```

## Test execution link

If you want the reporter to print the URL to SauceLabs test results, you need to add your SauceLabs dashboard URL.
The session ID will be filled by the reporter, so you only need to add a placeholder for it.
Depending on your SauceLabs authentication mechanism, you may also need to include the login URL.

```javascript
reporters: [{
  name: './reporter/saucelabsReporter', 
  resultsUrl: 'https://app.eu-central-1.saucelabs.com/tests/\\$\\{sessionId\\}',
  loginUrl: 'https://accounts.sap.com/saml2/idp/sso?sp=https://app.eu-central-1.saucelabs.com/sso/metadata'
}]
```
