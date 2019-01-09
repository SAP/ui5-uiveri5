# Visual Testing

## Overview
Visual testing is a css regression testing approach based on creating and comparing screenshot of a rendered component.
Reference screenshots could be stored locally or in central git-lfs-like repository.

## Test structure
Start a new visual test by coping an already existing one. Do not forget to add it to the test suite.
For recommendations on test code structure, see [Writing Test](applicationtesting.md)

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
Only one describe() block with name <lib>.<SpecName>.

## Usage in openui5
* Run all available tests:
```
$ grunt uiveri5
```

* Run only one visual test:
```
$ grunt uiveri5 --specs=ActionSelect
```

Please check [developing.md](https://github.com/SAP/openui5/blob/master/docs/developing.md) and
[tools.md](https://github.com/SAP/openui5/blob/master/docs/tools.md) for further command-line arguments that
uiveri5 grunt task accepts. 

## Issues

### "Spec name does not match control name" error
Spec name is used to resolve the control name and its meta information like control owner. Control owner is
necessary for assigning gerrit reviews for update of reference images. In case spec name does not match control
name, you need to explicitly specify the control name in suite meta data like:
````
describe("sap.m.AppWithBackground", function () {
	browser.testrunner.currentSuite.meta.controlName = 'sap.m.App';

	//... it() blocks
});
````

### Image name limitations
Image name can contain only allowed file system symbols like: litters, numbers, underscore, hyphen.
Image name length should be minimum 3 characters length and maximum 40 characters length.

## Configurations

### Override reference image storage for local image storage case
When localStorageProvider is used, by default the reference images are stored in the source tree, parallel to the
the tests in a subfolder 'visual'. This is fine if you plan to submit the images in git as part of the test.
In central visual test execution usaces, it could be useful to store the reference images in a separate folder,
outside ot the source tree. Configure the required folder in your conf.js like this:
```javascript
storageProvider: {name: './image/localStorageProvider',
  refImagesRoot: 'c:\imagestore',actImagesRoot:'c:\imagestore'}
```

### External image references in HTML report
You could overwrite images (reference and actual) root for consumption from remote host like:
```javascript
storageProvider: {name: './image/localStorageProvider',
  refImagesRoot: 'c:\imagestore',actImagesRoot:'c:\imagestore',
  refImagesShowRoot: 'file://share',actImagesShowRoot:'file://share'}
```

## Disclamer
Visual testing in default configuration depends on backend infrastructure for saving the screenshots and tooling and processes for updating the reference images. Currently, this setup is only available and supported for SAP openui5 project itself.
Anyway, if you wish to experiment with visual testing for other projects and you are ready to spend some time to configure it, do not hesitate to reach us for advice.
