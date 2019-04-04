# Visual Testing

## Overview
Visual testing is a CSS regression testing approach based on creating and comparing the screenshot of a rendered component.
Reference screenshots can be stored locally or in a central git-lfs-like repository.

## Test Structure
Start a new visual test by coping an already existing one. Don't forget to add it to the test suite.
For recommendations on test code structure, see [Application Testing](applicationtesting.md).

Example:
```js
describe('sap.m.Wizard', function() {
  it('should load test page', function () {
    expect(takeScreenshot()).toLookAs('initial');
  });
  it('should show the next page', function () {
    element(by.id('branch-wiz-sel')).click();
    expect(takeScreenshot()).toLookAs('branching-initial');
  });
});
```

## Limitations
Only one `describe()` block with name `<lib>.<SpecName>`.

## Usage in OpenUI5
* Run all available tests:
```
$ grunt uiveri5
```

* Run only one visual test:
```
$ grunt uiveri5 --specs=ActionSelect
```

Please check [Developing OpenUI5](https://github.com/SAP/openui5/blob/master/docs/developing.md) and
[Tools](https://github.com/SAP/openui5/blob/master/docs/tools.md) for further command-line arguments that
UIVeri5 grunt task accepts.

## Issues

### "Spec name does not match control name" error
Spec name is used to resolve the control name and its meta information, such as control owner. Control owner is
necessary for assigning gerrit reviews for update of reference images. In case spec name does not match control
name, you need to explicitly specify the control name in the suite metadata:
````
describe("sap.m.AppWithBackground", function () {
	browser.testrunner.currentSuite.meta.controlName = 'sap.m.App';

	//... it() blocks
});
````

### Image Name Iimitations
Image name can contain only allowed file system symbols, such as letters, numbers, underscore, and hyphen.
Image name has to be minimum 3 and maximum 40 characters long.

## Configurations

### Override reference image storage for local image storage case
When `localStorageProvider` is used, by default the reference images are stored in the source tree, parallel to the
the tests in a subfolder `visual`. This is fine if you plan to submit the images in Git as part of the test.

In central visual test execution usaces it could be useful to store the reference images in a separate folder
outside ot the source tree.

Configure the required folder in your conf.js file like this:
```javascript
storageProvider: {name: './image/localStorageProvider',
  refImagesRoot: 'c:\imagestore',actImagesRoot:'c:\imagestore'}
```

### External image references in HTML report
You can overwrite images (reference and actual) root for consumption from remote host:
```javascript
storageProvider: {name: './image/localStorageProvider',
  refImagesRoot: 'c:\imagestore',actImagesRoot:'c:\imagestore',
  refImagesShowRoot: 'file://share',actImagesShowRoot:'file://share'}
```

## Disclamer
Visual testing in default configuration depends on backend infrastructure for saving the screenshots, and tooling and processes for updating the reference images. Currently, this setup is only available and supported for the OpenUI5 project itself.

However, if you wish to experiment with visual testing for other projects and you are ready to spend some time to configure it, do not hesitate to reach us for advice.
