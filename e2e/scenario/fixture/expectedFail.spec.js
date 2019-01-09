describe('expectedFail', function() {
    it('should fail with wrong expectation', function() {
        expect(browser.getTitle()).toBe('Error');
    })
});
