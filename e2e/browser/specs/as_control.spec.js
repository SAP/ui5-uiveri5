/*global describe,it,element,by,takeScreenshot,expect*/

var utils = require('./utils');

describe("as_control", function () {
	"use strict";

	beforeAll(function () {
		utils.injectPageContent(browser, "app");
	});

	it("should get control properties", function () {
		var title = element(by.id("page1-title-inner")).asControl();
		expect(title.getProperty("id")).toEqual("page1-title");
		expect(title.getProperty("text")).toEqual("Page 1");
		expect(title.getProperty("visible")).toEqual(true);
	});

	it("should get controls for multiple elements", function () {
		var buttons = element.all(by.css("button"));

		expect(buttons.get(0).asControl().getProperty("text")).toEqual("Show footer");
		expect(buttons.get(1).asControl().getProperty("text")).toEqual("Hide footer");
	});
});
