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
        logInterceptor.start('INFO: Plugin:');

        return Runner.execTest({
            specs: './scenario/fixture/plugin.spec.js',
            baseUrl: app.host + '/plugin/app.html',
            confjs: './scenario/plugin.conf.js'
        }).then(function () {
            console.log('=====', logInterceptor.aLogs, '=====');
            expect(logInterceptor.aLogs.length).toBe(12);
            expect(logInterceptor.aLogs[0]).toContain('setup');
            expect(logInterceptor.aLogs[1]).toContain('onPrepare');
            expect(logInterceptor.aLogs[2]).toContain('describe block');
            expect(logInterceptor.aLogs[3]).toContain('suiteStarted');
            expect(logInterceptor.aLogs[4]).toContain('specStarted');

            expect(logInterceptor.aLogs[5]).toContain('first it block');
            expect(logInterceptor.aLogs[6]).toContain('specDone');
            expect(logInterceptor.aLogs[7]).toContain('specStarted');
            expect(logInterceptor.aLogs[8]).toContain('second it block');
            expect(logInterceptor.aLogs[9]).toContain('specDone');

            expect(logInterceptor.aLogs[10]).toContain('suiteDone');
            expect(logInterceptor.aLogs[11]).toContain('teardown');
            logInterceptor.stop();
        });
    },100000);
});