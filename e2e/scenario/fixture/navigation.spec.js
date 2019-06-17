describe('navigation', function() {
    it('should get new url', function() {
        browser.get(browser.testrunner.config.params.url);
        expect(browser.getTitle()).toBe('E2E Test');
    });

    it('should refresh page', function() {
        browser.refresh();
        expect(browser.getTitle()).toBe('E2E Test');
    });

    // TODO load non-ui5 page and redirect to app.html and inject our scripts

});
