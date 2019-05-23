var Runner = require('../Runner');

describe('Navigation scenario test', function() {

    it('should navigate in browser', () => {
        return Runner.execTest({
            specs: './scenario/fixture/navigation.spec.js',
            baseUrl: 'https://openui5nightly.hana.ondemand.com/test-resources/sap/m/demokit/master-detail/webapp/test/mockServer.html',
        });
    }, 60000);
});
