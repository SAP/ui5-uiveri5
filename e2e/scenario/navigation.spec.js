var Runner = require('../Runner');

describe('Navigation scenario test', function() {
    var app;

    beforeAll(() => {
        return Runner.startApp('/scenario/fixture/apps').then((appData) => {
            app = appData;
        })
    });

    afterAll(() => {
        app.server.close();
    });

    it('should navigate in browser', () => {
        return Runner.execTest({
            specs: './scenario/fixture/navigation.spec.js',
            baseUrl: 'https://openui5nightly.hana.ondemand.com/test-resources/sap/m/demokit/master-detail/webapp/test/mockServer.html',
        });
    }, 60000);

    it('should navigate in browser with auth', () => {
        return Runner.execTest({
            specs: './scenario/fixture/navigation_auth.spec.js',
            // skip authentication on start
            baseUrl: app.host + '/formauth/app.html?auth=true'
        });
    }, 60000);

});
