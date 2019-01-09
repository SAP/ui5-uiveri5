/*global beforeAll, describe, it, element, by, takeScreenshot, expect, createPageObjects, Given, When, Then*/

var utils = require('./utils');

describe("wait_recursive", function() {
  "use strict";

  beforeAll(function () {
    utils.injectPageContent(browser, "wait_recursive");
  });

  // verify wait after button click
  it("should click the button and wait", function() {
    element(by.id("button")).click();
    expect(element(by.id("button")).getText()).toBe("Click me");
  });
});
