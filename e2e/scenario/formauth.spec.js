var Runner = require('../Runner');

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
    
    it('should execute auth with redirect', () => {
        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/formauth/app.html',
            confjs: './scenario/formauth_url.conf.js'
        });
    },40000);

    it('should execute auth with redirect and regex for redirectUrl', () => {
        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/formauth/app.html',
            confjs: './scenario/formauth_regexp.conf.js'
        });
    },40000);
});