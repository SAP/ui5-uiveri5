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
* screenResolution - the screen resolution, you may need it with responsive app and assumtions for the screen size in the tests, example: "1280x1024"
* maxDuration - max duration of the whole test suite execution in seconds, default is 30min. Could be extended to 10800sec = 3hours for extremely long tests.
* idleTimeout - max duration for a single interaction. This is the time that the application needs to process the longest interaction like a navigation after a click. Default is 90sec and could be extended to 600sec for extremely slow
applications.
