var Runner = require('../Runner');
var LogInterceptor = require('../LogInterceptor');

describe('Browser log collector scenario test', function() {
    var app;

    beforeAll(() => {
        return Runner.startApp('/scenario/fixture/apps').then((appData) => {
            app = appData;
        })
    });

    afterAll(() => {
        app.server.close();
    });

    it('should collect debug logs', () => {
        var logInterceptor = new LogInterceptor();
        logInterceptor.start('BROWSER LOG:.*-browserLogsScenarioTest');
        return Runner.execTest({
            specs: 'scenario/fixture/logs.spec.js',
            baseUrl: app.host + '/logs/app.html',
            confjs: './scenario/logs.conf.js'
        }).then(function () {
            var logCount = 0;
            logInterceptor.aLogs.forEach(function (sLog) {
                var match = sLog.match(/browserLogsScenarioTest/g);
                logCount += match.length;
            });
            expect(logCount).toBe(5);
            logInterceptor.stop();
        }).catch(function() {
            expect(false).toBeTruthy();
        });
    }, 40000);
});
