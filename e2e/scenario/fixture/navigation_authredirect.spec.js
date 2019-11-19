describe('navigation_authredirect', function() {
    it('should get open url - inline config', function () {
        browser.get(browser.testrunner.config.params.url, {
            auth: 'plain'
        });
        expect(browser.getTitle()).toBe('E2E Test');
    });
});
