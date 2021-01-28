describe('navigation', function() {
    it('should get new url', function() {
        browser.get(browser.testrunner.config.params.url);
        expect(browser.getTitle()).toBe('E2E Test');
    });

    it('should refresh page', function() {
        browser.refresh();
        expect(browser.getTitle()).toBe('E2E Test');
    });

    it("should load browser dependencies", function () {
        browser.driver.get(browser.testrunner.config.params.url);
        expect(browser.driver.getTitle()).toBe('E2E Test');
        browser.loadUI5Dependencies();
        expect(browser.getTitle()).toBe('E2E Test');
    });
});
