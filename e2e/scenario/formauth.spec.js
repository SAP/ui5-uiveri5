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

    it('should execute auth only for the first test', () => {
        // will execute 2 spec files:
        // authOnce will change the page by a click;
        // authOnce2 will check that the change is still there - which would mean that there wasn't a second auth
        return Runner.execTest({
            specs: './scenario/fixture/authonce*.spec.js',
            specFilter: 'authonce_first,authonce_second',
            baseUrl: app.host + '/formauth/app.html',
            confjs: './scenario/formauth_url_once.conf.js'
        }).then(function () {

        });
    },60000);
});
