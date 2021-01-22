/*global beforeAll, describe, it, element, by, takeScreenshot, expect, createPageObjects, Given, When, Then*/

var utils = require('./utils');

describe("page_objects", function () {
  "use strict";

  beforeAll(function () {
		utils.injectPageContent(browser, "app");
  });
  
  createPageObjects({
    App: {
      arrangements: {
        iSetUpMyApp: function () {
          element(by.css("input")).sendKeys("setup");
          element(by.css("form")).element(by.css(".sapMSFB.sapMSFS")).click();
        }
      },
      actions: {
        iGoToPage2: function () {
          element(by.id("go-to-page-2-btn")).click();
        }
      },
      assertions: {
        theSearchTextShouldBeDisplayed: function () {
          expect(element(by.id("search-query")).getText()).toBe("setup");
        }
      }
    },
    Second: {
      assertions: {
        theScrollTextShouldBeDisplayed: function () {
          expect(element(by.id("page2-cont")).all(by.css("div")).get(0).getText()).toBe("This page does not scroll.");
        }
      }
    }
  });

	it("should load test page", function () {
    Given.iSetUpMyApp();
    Then.onTheAppPage.theSearchTextShouldBeDisplayed();
  });

  it("should go to page2", function () {
    When.onTheAppPage.iGoToPage2();
    Then.onTheSecondPage.theScrollTextShouldBeDisplayed();
  });

});
