/*global beforeAll, describe, it, element, by, takeScreenshot, expect, createPageObjects, Given, When, Then*/

var utils = require('./utils');

describe("wait", function() {
  "use strict";

  beforeAll(function () {
    utils.injectPageContent(browser, "wait");
  });

	// verify wait after button click
	it("should click the button and wait", function() {
    element(by.id("button")).click();
    expect(element.all(by.xpath('//div[contains(@class, "sapMMessageToast") and text() = "Pressed"]')).count()).toBe(1);
    expect(browser.getTitle()).toBe('E2E Test');
	});
});
