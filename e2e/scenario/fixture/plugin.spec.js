describe('plugin', function() {
    browser.logger.info('Plugin: describe block');

    it('show page - first', function() {
        browser.logger.info('Plugin: first it block');
        expect(browser.getTitle()).toBe('E2E Test');
    })

    it('show page - second', function() {
        browser.logger.info('Plugin: second it block');
        expect(browser.getTitle()).toBe('E2E Test');
    })
});
