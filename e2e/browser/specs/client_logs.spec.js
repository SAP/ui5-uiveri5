/*global describe,it,element,by,takeScreenshot,expect*/

var utils = require('./utils');
var LogInterceptor = require('../../LogInterceptor');

// TODO stabilize and reenable
xdescribe("client_logs", function () {
	"use strict";

	beforeAll(function () {
		utils.injectPageContent(browser, "app");
    });

	it("should include client logs if no element is found", function () {
        var logInterceptor = new LogInterceptor();
        logInterceptor.start('^DEBUG: No elements found using by.control locator. ' +
            'This is what control locator last logged:');
		var showNavButtton = element(by.control({
			id: "non-existent"
		}));

		showNavButtton.isPresent().then(function (isPresent) {
			expect(isPresent).toBeFalsy();
            expect(logInterceptor.aLogs[0]).toMatch(/Found no control with the global ID \'non-existent\'/);
            expect(logInterceptor.aLogs[0]).not.toMatch(/sap\.ui\.test\.autowaiter/);
            logInterceptor.stop();
		});
    });

    it("should include client logs on autoWaiter timeout", function () {
        browser.executeScript(function () {
            return !!uiveri5.autoWaiterAsync;
        }).then(function (isAutoWaiterLoaded) {
            // test is meaningful only for OPA5 autoWaiter
            if (isAutoWaiterLoaded) {
                browser.executeScript(function () {
                    uiveri5.autoWaiterAsync.extendConfig({
                        timeout: 200
                    });
                    var fnDelay = function (iDelay) {
                        setTimeout(function () {
                            fnDelay(iDelay + 50);
                        }, iDelay);
                    };
                    fnDelay(100);
                });

                element(by.id("page1-intHeader")).isPresent().then(function (isPresent) {
                    // should not get here
                    expect(true).toBeFalsy();
                }, function (oError) {
                    expect(oError).toMatch('Polling stopped because the timeout of 200 milliseconds has been reached ' +
                        'but there is still pending asynchronous work.');
                });
            }
        });
    });
});
