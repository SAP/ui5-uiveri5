var Runner = require('../Runner');
var restServiceMock = require('./fixture/mock/apiServiceMock');

describe('API tests', function() {
    var appMock;
    var app;

    beforeAll(() => {
        return Runner.startApp(restServiceMock).then((app) => {
            appMock = app;
        })
    });
    
    afterAll(() => {
        appMock.server.close();
    });

    it('should execute api tests', () => {
        return Runner.execTest({
            specs: './scenario/fixture/api.spec.js',
            confjs: './scenario/api.conf.js',
            params: {
                apiUrl: appMock.host
            }
        });
    }, 40000);
});
