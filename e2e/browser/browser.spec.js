var Runner = require('../Runner');

describe('Browser tests', function() {
    var app;

    beforeAll(() => {
        return Runner.startApp('/browser/fixture/apps').then((appData) => {
            app = appData;
        });
    });

    afterAll(() => {
       app.server.close();
    });

    it('should execute all UI5 tests', () => {
        return Runner.execTest({
            specs: './browser/specs/wait.spec.js',
            baseUrl: app.host + '/browser/index.html'
        });
    }, 80000);
});
