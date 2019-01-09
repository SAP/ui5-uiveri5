# Application testing

### Test runtime
UIVeri5 is inspired from [Protractor](https://www.protractortest.org) and builds on many of its ideas. Most of the answers you may find for protractor apply for UIVeri5. But please note that under the hood we use an older version of protractor (v5.6) so some of the most recent stuff like await/async and disabling control flow is not available yet. An overview of uiveri5 test runtime is available in [Runtime](runtime.md).

### Expectations
To assert the state of your application, use [Expectations](expectations.md).

### Locators
Control locators can be very handy to the control lеvel of abstraction and not having to dig down into DOM level. Details on locators can be found in [Locators](locators.md).

### Page Objects
We recommend using the page object pattern in integration tests. For page object examples, see [Page Objects](pageobjects.md).

### Debugging
The test is running in the nodejs environment and drives the browser. Check how to debug yoyr test in [Debug](debug.md). Once you hit a breakppoint in the test, you can open DevTools in browser and inspect the application state. Do not forget to close the devtools before resuming the test.


