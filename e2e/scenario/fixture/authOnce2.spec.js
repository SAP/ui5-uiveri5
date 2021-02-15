describe('authOnce2', function() {
    it('show second page', function() {
        // should be authenticated only once;
        // footer should remain shown after authOnce.spec.js
        expect(element(by.id('page1-footer')).isDisplayed()).toBeTruthy();
    })
});
