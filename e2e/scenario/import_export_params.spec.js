var Runner = require('../Runner');
var path = require('path');
var fs = require('fs');

describe('import and export of params - scenario test', function() {
  var app;

  beforeAll(() => {
    return Runner.startApp('/scenario/fixture/apps').then((appData) => {
      app = appData;
    })
  });

  afterAll(() => {
      app.server.close();
  });

  it('should import and export params', () => {
      return Runner.execTest({
          specs: './scenario/fixture/params.spec.js',
          baseUrl: app.host + '/logs/app.html', // choose a random app with no auth
          confjs: './scenario/import_export_params.conf.js',
          params: {
            param_2: 'param from cli'
          }
      });
  }, 40000);

  it('should see exported params', () => {
    return new Promise((resolve) => {
      var file = path.resolve(__dirname, './fixture/export_params.json');
      _pollForFile(file, function (exportedParams) {
        expect(Object.keys(exportedParams).length).toBe(2);
        expect(exportedParams.new_param).toBe('exported param');
        expect(exportedParams.param_1).toBe('param from file - changed');
        fs.unlinkSync(file);
        resolve();
      })();
    });
  }, 40000);

  function _pollForFile(path, cb, tries) {
    tries = tries || 0;
    return function () {
      try {
        cb(require(path));
      } catch (e) {
        if (tries < 15) {
          setTimeout(_pollForFile(path, cb, tries + 1), 2000);
        } else {
          throw e;
        }
      }
    };
  }

});
