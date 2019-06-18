describe('navigation_auth', function() {
    it('should get protected url - inline config', function () {
        browser.get(browser.testrunner.config.params.url, {
            auth: {
                'sapcloud-form': {
                    user: 'user',
                    pass: 'pass'
                }
            }
        });
        expect(browser.getTitle()).toBe('E2E Test');
    });
});
