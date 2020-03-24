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
    expect(element.all(by.css(".sapMMessageToast")).count()).toBe(1);
	});
});
