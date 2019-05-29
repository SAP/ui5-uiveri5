describe('navigation_auth', function() {
    it('should get protected url - inline config', function () {
        browser.driver.getCurrentUrl().then(function (sUrl) {
            var sProtectedUrl = sUrl.replace("?auth=true", "");
            browser.getProtected(sProtectedUrl, {
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
});
