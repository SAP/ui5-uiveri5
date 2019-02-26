var Runner = require('../Runner');
var LogInterceptor = require('../LogInterceptor');

describe('Plugin scenario test', function() {
    var app;

    beforeAll(() => {
        return Runner.startApp('/scenario/fixture/apps').then((appData) => {
            app = appData;
        })
    });
    
    afterAll(() => {
        app.server.close();
    });
    
    it('should load plugin', () => {
        var logInterceptor = new LogInterceptor();
        logInterceptor.start('uiveri5 console: INFO: Plugin:');

        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/plugin/app.html',
            confjs: './scenario/plugin.conf.js'
        }).then(function () {
            expect(logInterceptor.aLogs.length).toBe(7);
            expect(logInterceptor.aLogs[0]).toContain("setup");
            expect(logInterceptor.aLogs[1]).toContain("onPrepare");
            expect(logInterceptor.aLogs[2]).toContain("suiteStarted: empty");
            expect(logInterceptor.aLogs[3]).toContain("specStarted: show page");
            expect(logInterceptor.aLogs[4]).toContain("specDone: show page");
            expect(logInterceptor.aLogs[5]).toContain("suiteDone: empty");
            expect(logInterceptor.aLogs[6]).toContain("teardown");
            logInterceptor.stop();
        });
    },40000);
});