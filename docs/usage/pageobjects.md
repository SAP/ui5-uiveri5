### Page Objects (PO)
Frequently there is advantage in gathering selectors in a semantical objects that describe the structure of the
page to be tested. This approach have many benefits, like simplifying the understanding of the test, simplifying
potential modifications. Object literal notation in JavaScript gives allowys simple and expressive syntax for PO
declaration and usage.

Declare POs:
```javascript
var shell = {
  header: {
    userName: element(by.css('.sapUshellShell .sapUShellShellHeader .sapUShellShellHeadUsrItmName'));
  },
  tiles: {
    trackPurchaseOrder:
      element.all(by.css('.sapUshellShell .sapUshellTile .sapUshellTileInner')).get(0)
  }
};
```
Use PO:
```javascript
it('should load the Start Screen', function () {
  expect(browser.getTitle()).toBe('Home');
  expect(shell.header.userName.getText()).toBe('BLACKM');

  // click on the "Track Purchase Order" tile
  shell.tiles.trackPurchaseOrder.click();
});
```

#### POs in common file
If several test scripts interact with a single page, it would be nice to extract the POs to separate files.
They could be referenced from every test script that needs them. Test scripts are effectively
[node modules](https://nodejs.org/api/modules.html) and could use arbitrary [nodejs](https://nodejs.org/en/about/)
functinality.

Declare PO:
```javascript
// pages/shell.view.js:
module.exports = {
  header: {
    userName: element(by.css('.sapUshellShell .sapUShellShellHeader .sapUShellShellHeadUsrItmName'));
  },
  tiles: {
    trackPurchaseOrder:
      element.all(by.css('.sapUshellShell .sapUshellTile .sapUshellTileInner')).get(0)
  }
}
```
Import PO in test script:
```javascript
// purchaseOrder.spec.js
var shellView = require('./pages/shell.view');

describe('Fiori_MM', function () {
  it('should load the Start Screen', function () {
    expect(browser.getTitle()).toBe('Home');
    expect(shellView.header.userName.getText()).toBe('BLACKM');

    // click on the "Track Purchase Order" tile
    shellView.tiles.trackPurchaseOrder.click();
  });
});
```
#### Heavyweight POs
Sometimes you can go further in logic isolation by moving all the interaction and assertions to page object methods, leaving only the step sequence in the spec. This leads to self-explanatory test code and improved reusability and separation of concerns.
Write page interactions:
```javascript
// pages/shell.view.js:
var userName = element(by.css('.sapUshellShell .sapUShellShellHeader .sapUShellShellHeadUsrItmName'));
var trackPurchaseOrder = element.all(by.css('.sapUshellShell .sapUshellTile .sapUshellTileInner')).get(0);

module.exports = {
  verifyHeader: function (text) {
    expect(userName.getText()).toBe(text);
  },
  clickTrackPurchaseOrderTile: function () {
    trackPurchaseOrder.click();
  }
}
```
Describe test steps:
```javascript
// purchaseOrder.spec.js
var shellView = require('./pages/shell.view');

describe('Fiori_MM', function () {
  it('should load the Start Screen', function () {
    shellView.verifyHeader('BLACKM');
    shellView.clickTrackPurchaseOrderTile();
  });
});
```

#### BDD
From heavyweight POs you can move on to writing BDD-style tests that read as a description of the user experience with the application. UIVeri5 provides a basis for writing BDD style tests using the Given-When-Then formula. It is an example implementation that is easy and ready to use. All you need to do is separate your PO into `arrangements`, `actions` and `assertions` sections and add it to the framework using `createPageObjects`, preferably in `beforeAll`. CreatePageObjects accepts a map of multiple page object definitions. Then for example, you can access the method 'iClickTheButton' of the page with name 'start' using When.onTheStartPage.iClickTheButton(). The structure is kept close to the idea of OPA5's [page objects](https://openui5.hana.ondemand.com/#/topic/ce4b180d97064ad088a901b53ed48b21)
Create page object:
```javascript
// pages/shell.view.js:
var userName = element(by.css('.sapUshellShell .sapUShellShellHeader .sapUShellShellHeadUsrItmName'));
var trackPurchaseOrder = element.all(by.css('.sapUshellShell .sapUshellTile .sapUshellTileInner')).get(0);

module.exports = createPageObjects({
  Shell: {
    arrangements: {
      iStartTheApp: function () {
        // app setup
      }
    },
    actions: {
      iClickTheTrackPurchaseOrderTile: function () {
        trackPurchaseOrder.click();
      }
    },
    assertions: {
      theHeaderTextShouldBeDisplayed: function (text) {
        expect(userName.getText()).toBe(text);
      }
    }
  }
});
```
Include page objects and describe test steps:
```javascript
// purchaseOrder.spec.js
var shellPageObject = require('./pages/shell.view');

describe('Fiori_MM', function () {
  it('should load the Start Screen', function () {
    Given.iStartTheApp();
    Then.onTheShellPage.theHeaderTextShouldBeDisplayed('BLACKM');
    When.onTheShellPage.iClickTheTrackPurchaseOrderTile();
  });
});
```
