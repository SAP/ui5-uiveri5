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
            baseUrl: null,
            params: {
                url: app.host + '/formauth/app.html?auth=true'  // skip auth
            }
        });
    }, 60000);

    it('should navigate in browser with auth', () => {
        return Runner.execTest({
            specs: './scenario/fixture/navigation_auth.spec.js',
            baseUrl: null,
            params: {
                url: app.host + '/formauth/app.html'
            }
        });
    }, 60000);
});
