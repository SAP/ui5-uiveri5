const { element } = require("protractor");

describe('authOnce', function() {
    it('click button', function() {
        element(by.id('show-footer-btn')).click();
        expect(element(by.id('page1-footer')).isDisplayed()).toBeTruthy();
    })
});
