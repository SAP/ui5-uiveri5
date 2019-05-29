describe('navigation', function() {
    it('should get new url', function() {
        browser.get('https://openui5nightly.hana.ondemand.com/test-resources/sap/m/demokit/master-detail/webapp/test/mockServer.html#/Objects/ObjectID_1');
        expect(browser.getTitle()).toBe('Master-Detail');
        browser.navigate().back();
    });

    it('should refresh page', function() {
        browser.refresh();
        expect(browser.getTitle()).toBe('Master-Detail');
    });
});
