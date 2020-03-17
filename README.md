![openui5](http://openui5.org/images/OpenUI5_new_big_side.png)

## What is it
UIVeri5 is an E2E testing framework for [UI5](https://ui5.sap.com)-based applications. It uses
[WebDriverJS](https://code.google.com/p/selenium/wiki/WebDriverJs) to drive a real browser and interacts with your
application as a real user would. UIVeri5 is heavily inspired by [Protractor](http://www.protractortest.org/)
and brings most (and more) of its benefits to UI5 applications.

### Benefits
* Automatic synchronization with UI5 app rendering so there is no need to add waits and sleeps to your test. Tests are reliable by design.
* Tests are written in synchronous manner, no callbacks, no promise chaining so are really simple to write and maintain.
* Full power of webdriverjs, protractor and jasmine - deferred selectors, custom matchers, custom locators.
* Control locators (OPA5 declarative matchers) allow locating and interacting with UI5 controls.
* Does not depend on testability support in applications - works with autorefreshing views, resizing elements, animated transitions.
* Declarative authentications - authentication flow over OAuth2 providers, etc.
* Console operation, CI ready, fully configurable, no need for java (comming soon) or IDE.
* Covers full UI5 browser matrix: Chrome, Firefox, IE, Edge, EdgeLegacy, Safari, iOS, Android.
* Open-source, modify to suite your specific neeeds.

## Requirements
* [NodeJS](https://nodejs.org/en/download/), version 8.0 or higher

## Configuration
UIVeri5 accepts a declarative configuration in a conf.js file. Configuration could be overriten with command-line arguments.
All configuration options are explained in [Configuration](docs/config/config.md)

## Installation
Install globally:
```
$ npm install @ui5/uiveri5 -g
```

## Usage

### Create a test
Create a clean folder that will contain your test and configuration files. UIVeri5 uses [Jasmine](https://jasmine.github.io/) as a test runner so the test resides in a spec.js file.
Put the declarative configuration in the conf.js file.

* conf.js
```js
exports.config = {
  profile: 'integration',

  baseUrl: 'https://openui5.hana.ondemand.com/test-resources/sap/m/demokit/master-detail/webapp/test/mockServer.html',
};
```

* masterdetail.spec.js
```js
describe('masterdetail', function () {

  it('should load the app',function() {
    expect(browser.getTitle()).toBe('Master-Detail');
  });

  it('should display the details screen',function() {
    element(by.control({
      viewName: 'sap.ui.demo.masterdetail.view.Master',
      controlType: 'sap.m.ObjectListItem',
      properties: {
        title: 'Object 11'
      }}))
    .click();
  });

  it('should validate line items',function() {
    expect(element.all(by.control({
      viewName: 'sap.ui.demo.masterdetail.view.Detail',
      controlType:'sap.m.ColumnListItem'}))
    .count()).toBe(2);
  });
});
```

### Run the test
Open console in the test folder and execute:
```
$ uiveri5
```
You will see the test execution in the console and an overview when the test completes. Check the target folder for a visual report with screenshots.

### Usage hints
By default uiveri5 will discover all tests in current folder and execute them on localy started Chrome.
All of those defaults could be modified either in conf.js or by providing command-line arguments.

* Enable verbose logging
```
-v
```
* Run tests on different browser
```
--browsers=firefox
```
* Run tests against app deployed on a specific system
```
--baseUrl="http://<host>:<port>/app"
```
* Run tests against a remote selenium server
```
--seleniumAddress="<host>:<port>/wd/hub"
```

## Learn more
Learn how to build your tests in our [Testing Guide](docs/usage/applicationtesting.md).

## Support
If you face a problem, please check our list of common [issues](docs/issues.md).
If you think you found a bug, please create a new [github issue](https://github.com/SAP/ui5-uiveri5/issues/new). 
If you have a question, please ask on [StackOverflow](http://stackoverflow.com/questions/tagged/uiveri5).

## Known Bugs
No major bugs known.

## Release plan
See how we plan to continue in our [TODO](docs/todo.md) .

## Related projects
Here we gather few projects that build on UIVeri5 and tailor it for specific usecases.

* Docker container with UIVeri5, Chrome, Jenkins: [Link](https://github.com/frumania/docker-uiveri5-jenkins-slave)

## Automatic Downloads
By default, when running locally, UIVeri5 downloads selenium.jar and/or the respective webdrivers - chromedriver, geckodriver,InternetExplorerDriver from their official locations. You can disable the downloading or change the locations in profile.conf.js. When using --seleniumAddress, nothing is downloaded.

## Licence
Copyright (c) 2018 SAP SE or an SAP affiliate company. All rights reserved.
This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE](LICENSE.txt) file.
