# visualtestjs ( will become ui5test )

## Introduction
Visualtesjs is a visual and application testing framework for UI5-base applications. It is using
[webdriverjs](https://code.google.com/p/selenium/wiki/WebDriverJs) to drive a real browser and interacts with your
application as a real user would. Visualtestjs is heavily inspired and based on [Protractor](http://www.protractortest.org/)
and brings most of its benefits to UI5 applications.

### Benefits
* Automatic synchronization with UI5 app rendering so there is no need to add waits and sleeps to your test.
* Tests are written in synchronous manner, no callbacks, no promise chaining so are really simple to write and maintain.
* Full power of webdriverjs, protractor and jasmine - deferred selectors, custom matchers, custom locators.
* Open-source (comming soon), console operation, fully configurable, no need for java(comming soon) or IDE.
* Covers full ui5 browser matrix - Chrome,Firefox,IE on Win7,8, Edge on Win10, Safari on Mac and iOS, Chrome on Android.

### Visual testing
Visual testing is a css regression testing approach based on creating and comparing screenshot of a rendered component.
Reference screenshots could be stored locally or in central git-lfs-like repository (comming soon).
An except of actual visual test:
````
describe('sap.m.Wizard', function() {
	it('should load test page', function () {
		expect(takeScreenshot()).toLookAs('initial');
	});
	it('should show the next page', function () {
		element(by.id('branch-wiz-sel')).click();
		expect(takeScreenshot()).toLookAs('branching-initial');
	});
});
````
### Application testing
The synchronous nature of the test written with visualtesjs greatly simplifies the creation and maintenance of application tests.
A except of actual Fiori application test:
````
var masterSection = {
  search: {
    input: element(by.comp(masterSectionSearchWrapper + sapMSearchInput)),
    searchIcon: element(by.css(masterSectionSearchWrapper + sapMSearchIcon))
  },
  filterIcon: element(by.css(masterSectionWrapper + sapMPageFooter + sapMBarRight + sapMButton))
};

//FILTER POPUP
var filterPopupWrapper = staticArea + sapMDialog + '[style*="visibility: visible"]';
var filterPopup = {
  noneFilterItem:
    element.all(by.css(filterPopupWrapper + sapMDialogSection + sapMList + sapMListItems)).get(7),
  okButton: element(by.cssContainingText(filterPopupWrapper + sapMDialogFooter + sapMButton,'OK'))
};

it('should view the TrackPurchase Order screen', function () {
  // set default filter
  // show filter
  masterSection.filterIcon.click();

  // select 'Only With Alerts'
  filterPopup.noneFilterItem.click();
  filterPopup.okButton.click();

  //Search for purchase orders with a certain supplier, and check if the results are correct
  masterSection.search.input.clear().sendKeys(testData.SUPPLIER_NAME);
  masterSection.search.searchIcon.click();
  expect(masterSection.orders.list.count()).toBe(masterSection.orders.forSupplierList.count());

  //Doublecheck that some results are correct
  masterSection.orders.first.click();
  expect(purchaseOrderPage.supplierTitle.getText()).toBe(testData.SUPPLIER_NAME);
});
````

### Application testing further development
* Component selectors (__not available yet__). 
In the application testing approach outlined above, we use hierarchical class selectors composed of UI5 component main
(marker) class names. This hierarchical composition is important to guarantee the stability of selectors,
check [here](docs/applicationtesting.md) for further details. But the usage of component classes is somehow problematic
as DOM is not UI5 API and DOM could change between UI5 minor releases. Only UI5 JS API is guaranteed to be
backward-compatible so an approach to mitigate this issue is to use component selectors.
Component selector is a css-like selector that works on the UI5 component tree and not on the DOM tree.
This selector is handled by ToolsAPI inside recent UI5 versions (>1.34) and integrates nicely with
(UI5 Inspector)[https://chrome.google.com/webstore/detail/ui5-inspector/bebecogbafbighhaildooiibipcnbngo]
````
masterSection = {
  filterIcon: element(by.comp('sap.m.PageFooter sap.m.Button[label="filter"]')
}
masterSection.filterIcon.click();
````

## Usage

### Visual testing

### Run visual tests for openui5
* Pull grunt support and sample tests from this draft commit:
```
$ git pull ssh://<user>@git.wdf.sap.corp:29418/openui5 refs/changes/45/826745/16
```
* Update dependencies so latest visualtestjs is used:
```
$ npm update visualtestjs
```
* Run all available tests:
```
$ grunt visualtest
```
Please check [developing.md](https://github.com/SAP/openui5/blob/master/docs/developing.md) and
[tools.md](https://github.com/SAP/openui5/blob/master/docs/tools.md) for further command-line arguments that
visualtest grunt task accepts. Please check [controllibraries.md](https://github.com/SAP/openui5/blob/master/docs/controllibraries.md)
and [visualtesting.md](docs/visualtesting.md) how to write visual tests.
Please use the sample visual tests from the draft commit above for reference.

### Run visual tests for ui5-contributor project
* Please follow the procedure [install globally](docs/installation.md).
* Create a conf.js file in the root of your project with the following content:
```
exports.config = {
  profile: 'visual'
};
```
To store the reference images outside the source tree, check [visualtesting.md](docs/visualtesting.md)
* Start your server
* Run all available tests:
```
$ visualtest
```
### Integration testing
* Please follow the procedure [install globally](docs/installation.md).
* Create a folder for your integration tests, place them inside and create a conf.js file:
```
exports.config = {
  profile: 'integration'
};
```
* Run all *.spec.js tests from the folder that contains conf.js. Make sure that root suite is named as spec file name.
```
$ visualtest
```

### Features

By default visualtest will discover all applicable visual tests and execute them on local chrome
over automatically started selenium server on localhost:4444.
All of the defaults could be modified either in conf.js or by providing command-line arguments.

* Run tests on different browser
```
--browsers=firefox
```
* Run tests on Chrome, Firefox and InternetExplorer in parallel __not implemented__
```
--browsers=chrome,firefox,ie
```
* Run tests against test content on remote sapui5 runtime
```
--baseUrl="http://<host>:<port>"
```
* Run tests on remove selenium server
```
--seleniumAddress="<host>:<port>/wd/hub"
```
* Run tests on specific Browser/OS combination.
```
--browsers="ie:9:windows:8"
--browsers="chrome:*:windows"
```
* Run tests over remote connection (sauselabs, browserstack, ..) __not implemented__
```
--browsers="chrome:*:android:4.4" --connection="sauselabs:<user>:<token>:<url>:<further params>"
```
## Development
### Run unit tests from visualtestjs project
```
$ npm run test
```
### Run unit tests for grunt integration from openui5 project
```
$jasmine-node grunt/spec/selenium_visualtest.spec.js
```
