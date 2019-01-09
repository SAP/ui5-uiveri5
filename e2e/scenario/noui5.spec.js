

var Runner = require('../Runner');
var LogInterceptor = require('../LogInterceptor');

describe('FormAuth scenario test', function() {
    var app;

    beforeAll(() => {
        return Runner.startApp('/scenario/fixture/apps').then((appData) => {
            app = appData;
        })
    });
    
    afterAll(() => {
        app.server.close();
    });

    it('should fail if no UI5 on page', () => {
        var logInterceptor = new LogInterceptor();
        logInterceptor.start('uiveri5 console: INFO: Expectation FAILED: Failed: loadUI5Dependencies: No UI5 on this page');
        return Runner.execTest({
            specs: 'scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/noui5/app.html'
        }).catch(function () {
            expect(logInterceptor.aLogs.length).toBeTruthy();
            logInterceptor.stop();
        });
    }, 40000);
});