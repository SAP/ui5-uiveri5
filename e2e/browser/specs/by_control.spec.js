/*global describe,it,element,by,takeScreenshot,expect*/

var utils = require('./utils');

describe("by_control", function () {
	"use strict";

	beforeAll(function () {
		utils.injectPageContent(browser, "app");
	});

	it("should match control's aggregation length with 'aggregationLengthEquals'", function () {
		var oList = element(by.control({
			id: "ListPage1",
			aggregationLengthEquals: {
				name: "items",
				length: 3
			}
		}));
		expect(oList.getAttribute("id")).toContain("ListPage1");
	});

	it("should get matching control ref", function () {
		var navButton = element(by.control({
			id: "show-nav-btn"
		}));
		var showNavButton = element(by.control({
			controlType: "sap.m.Button",
			propertyStrictEquals: [
				{name: "icon", value: ""},
				{name: "text", value: "show Nav Button"}
			]
		}));

		expect(showNavButton.getAttribute("id")).toEqual("show-nav-btn");
		expect(showNavButton.getTagName()).toEqual("button");
		expect(showNavButton.getText()).toEqual("show Nav Button");

		showNavButton.click();

		expect(navButton.getCssValue("visibility")).toEqual("visible");
	});

	it("should get multiple matching control refs", function () {
		var buttons = element.all(by.control({
            controlType: "sap.m.Button"
        }));

		expect(buttons.get(0).getAttribute("id")).toEqual("show-footer-btn");
		expect(buttons.get(0).getTagName()).toEqual("button");
		expect(buttons.get(0).getText()).toEqual("Show footer");

		expect(buttons.get(1).getAttribute("id")).toEqual("hide-footer-btn");
		expect(buttons.get(1).getTagName()).toEqual("button");
		expect(buttons.get(1).getText()).toEqual("Hide footer");
	});

	it("should get child control ref", function () {
		var navButton = element(by.id("page1-intHeader-BarLeft"))
			.element(by.control({
				controlType: "sap.m.Button"
			}));

		element(by.id("show-nav-btn")).click();
		expect(navButton.getAttribute("id")).toEqual("page1-navButton");
	});

	it("should get multiple child control refs", function () {
		var footerButtons = element(by.control({
			id: "page1-footer"
		})).all(by.control({
			controlType: "sap.m.Button"
		}));

		expect(footerButtons.count()).toEqual(4);
	});

	it("should use control adapters", function () {
		var searchField1 = element(by.control({
			controlType: "sap.m.SearchField",
			interaction: {idSuffix: "I"}
		}));
		var searchField2 = element(by.control({
			controlType: "sap.m.SearchField",
			interaction: "focus" // same input, different way to get it
		}));
		var search = element(by.control({
			controlType: "sap.m.SearchField",
			interaction: "press"
		}));
		var searchQuery = element(by.control({
			id: "search-query"
		}));

		expect(searchField1.getTagName()).toEqual("input");
		expect(searchField2.getTagName()).toEqual("input");
		expect(search.getAttribute("id")).toEqual("SFB1-search");

		searchField1.sendKeys("a");
		searchField1.clear();
		searchField2.sendKeys("a");
		search.click();

		expect(searchQuery.getText()).toEqual("a");
	});

	it("should find control by ID regex", function () {
		var footerRegexps = [
			/^pa.*[0-9]+-foo/,
			/^PA.*[0-9]+-foo/gi,
			new RegExp("^PA.*[0-9]+-foo", "gi")
		].forEach(function (oRegexp) {
			var footer = element(by.control({
				id: oRegexp
			}));
			expect(footer.getAttribute("id")).toEqual("page1-footer");
		});
	});

	it("should find control by property regex", function () {
		var showNavButton = element(by.control({
			controlType: "sap.m.Button",
			properties: {text: "show Nav Button"}
		}));
		expect(showNavButton.getText()).toEqual("show Nav Button");

		var showNavButtonRegexps = [
			/show Nav/,
			/SHOW NAV/gi,
			new RegExp("^SHOW NAV", "gi")
		].forEach(function (oRegexp) {
			var showNavButton = element(by.control({
				controlType: "sap.m.Button",
				properties: {text: oRegexp}
			}));
			expect(showNavButton.getText()).toEqual("show Nav Button");
		});
	});

	it("should find control by binding path regex", function () {
		var input = element(by.control({
			controlType: "sap.m.Input",
			bindingPath: {
				path: "/compositeProperty"
			}
		}));
		expect(input.getAttribute("value")).toEqual("some");

		[/comp.*site/, /COMP.*SITE/gi, new RegExp("^\/COMP.*SITE", "gi")].forEach(function (oRegExp) {
			var input = element(by.control({
				controlType: "sap.m.Input",
				bindingPath: {
					path: oRegExp
				}
			}));
			expect(input.getAttribute("value")).toEqual("some");
		});
	});

	it("should use ancestor and descendant as selector keys", function () {
		element(by.id("show-nav-btn")).click();

		var listItem = element(by.control({
			controlType: "sap.m.StandardListItem",
			properties: {title: "2"},
			ancestor: {
				id: "ListPage1",
				descendant: {
					controlType: "sap.m.StandardListItem",
					properties: {title: "2"}
				}
			}
		}));

		expect(listItem.getText()).toEqual("2");

		var list = element(by.control({
			controlType: "sap.m.List",
			descendant: {
				controlType: "sap.m.StandardListItem",
				properties: {title: "3"}
			}
		}));

		expect(list.getAttribute("id")).toContain("ListPage1");
	});

	it("should use ancestor and descendant regex", function () {
		element(by.id("show-nav-btn")).click();
		var listItem = element(by.control({
			controlType: "sap.m.StandardListItem",
			properties: {
				title: /2/
			},
			ancestor: {
				id: /listpage/i,
				descendant: {
					controlType: "sap.m.StandardListItem",
					properties: {
						title: /[2-4]/
					}
				}
			}
		}));

		expect(listItem.getText()).toEqual("2");

		var list = element(by.control({
			controlType: "sap.m.List",
			descendant: {
				controlType: "sap.m.StandardListItem",
				properties: {
					title: new RegExp("3")
				}
			}
		}));

		expect(list.getAttribute("id")).toContain("ListPage1");
	});
});
