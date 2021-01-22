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
    },60000);

    it('should execute auth with redirect and regex for redirectUrl', () => {
        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/formauth/app.html',
            confjs: './scenario/formauth_regexp.conf.js'
        });
    },60000);

    it('should execute auth with custom idp link', () => {
        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/formauth/app.html?idp=true',
            confjs: './scenario/formauth_idp.conf.js'
        });
    },60000);

    it('should execute auth with conditional id provider', () => {
        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/formauth/app.html?conditional=true',
            confjs: './scenario/formauth_conditional.conf.js'
        });
    },60000);

    it('should execute auth with authorization button', () => {
        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/formauth/app.html?authorize=true',
            confjs: './scenario/formauth_authorize.conf.js'
        });
    },60000);

    it('should execute auth with authorization button - with delay', () => {
        return Runner.execTest({
            specs: './scenario/fixture/empty.spec.js',
            baseUrl: app.host + '/formauth/app.html?authorize=true&delay',
            confjs: './scenario/formauth_authorize.conf.js'
        });
    },80000);
});
