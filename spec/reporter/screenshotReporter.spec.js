var _ = require("lodash");
var ScreenshotReporter = require("../../src/reporter/screenshotReporter");

describe("screenshotReporter", function () {
  it("Should write screenshot with names at most 251 chars", function () {
    var screenshotReporter = new ScreenshotReporter({}, {}, {}, {});
    var longName = _.pad("very-long-name", 300, "-name-");
    var expectationName = screenshotReporter._generateExpectationScreenshotName(longName, true);
    var actionName = screenshotReporter._generateActionScreenshotName("sendKeys", longName);
    expect(expectationName.length).toBeLessThan(252);
    expect(actionName.length).toBeLessThan(252);
  });

});
