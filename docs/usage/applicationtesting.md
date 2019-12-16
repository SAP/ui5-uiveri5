# Application Testing

### Test Runtime
UIVeri5 is inspired from [Protractor](https://www.protractortest.org) and builds on many of its ideas. Most of the answers you may find for Protractor apply for UIVeri5. Please note that under the hood we use an older version of Protractor (v5.6), so some of the most recent functionalities like disabling control flow are not supported. You can structure your test with async/await to simplify the debugging even with enabled control flow. For an overview of UIVeri5's test runtime, see [Runtime](runtime.md).

### Expectations
To assert the state of your application, use [Expectations](expectations.md).

### Locators
Control locators can be very handy to the control lеvel of abstraction and not having to dig down into DOM level. Details on locators can be found in [Locators](locators.md).

### Page Objects
We recommend using the page object pattern in integration tests. For page object examples, see [Page Objects](pageobjects.md).

### Navigation
Browser navigation should always be followed by synchronization with UI5. See what methods are available in [Browser](browser.md).

### Debugging
The test is running in the Node.js environment and drives the browser. Check how to debug your test in [Debug](debug.md). Once you hit a breakppoint in the test, you can open DevTools in the browser and inspect the application state. Do not forget to close the DevTools before resuming the test.


