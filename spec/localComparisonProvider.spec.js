
var fs = require('fs');
var LocalStorageProvider = require('../src/image/localStorageProvider.js');
var LocalComparisonProvider = require('../src/image/localComparisonProvider.js');

describe("LocalComparisonProvider", function () {
  var logger = require('../src/logger')(3);
  var matchers = {};
  var imagePath = '/localComparisonProvider/images/testSpec/platform/resolution/browser/theme/direction/mode';
  var actImagePath = imagePath + '/arrow_left.act.png';
  var diffImagePath = imagePath + '/arrow_left.diff.png';

  function takeScreenshotMock(name){
    return fs.readFileSync(__dirname + '/localComparisonProvider/' + name + '.png');
  }

  beforeAll(function () {
    var spec = {
      fullName: 'sap.testSpec',
      name: 'testSpec',
      testPath: 'not-used'
    };
    var runtime = {
      platformName: 'platform',
      platformResolution: 'resolution',
      browserName: 'browser',
      ui5: {
        theme: 'theme',
        direction: 'direction',
        mode: 'mode'
      }
    };
    var storageProvider = new LocalStorageProvider({},{
        refImagesRoot: __dirname + '/localComparisonProvider',
        actImagesRoot:'target/localComparisonProvider/images'},
      logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    var comparisonConfig = {
      tolerance: 10,
      compare: true
    };
    var comparisonInstanceConfig = {
      ignoreColors: false
    };
    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);
  });

  it('Should pass with similar images', function (done) {
    var result = matchers.toLookAs().compare(takeScreenshotMock('arrow_left'),'arrow_left');
    result.pass.promise.then(
      function(passed){
        expect(passed).toBe(true);
        done();
      }
    );
  });

  it('Should fail with different images', function(done) {
    var result = matchers.toLookAs().compare(takeScreenshotMock('arrow_left_hover'),'arrow_left');
    result.pass.promise.then(
      function(passed){
        expect(passed).toBe(false);
        // remove leftovers
        fs.unlinkSync('target' + actImagePath);
        fs.unlinkSync('target' + diffImagePath);
        done();
      }
    );
  });
});
