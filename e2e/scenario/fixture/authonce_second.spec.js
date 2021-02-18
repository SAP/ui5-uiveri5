describe('authonce_second', function() {
    it('show page', function() {
        // should be authenticated only once;
        // footer should remain shown after authOnce.spec.js
        expect(element(by.id('page1-footer')).isDisplayed()).toBeTruthy();
    })
});
