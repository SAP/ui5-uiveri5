
var fs = require('fs');
global.protractorModule = module;
var LocalStorageProvider = require('../src/image/localStorageProvider.js');
var LocalComparisonProvider = require('../src/image/localComparisonProvider.js');

describe("LocalComparisonProvider", function () {
  var logger = require('../src/logger')(3);
  var matchers = {};
  var imagePath = '/localComparisonProvider/images/testSpec/platform/resolution/browser/theme/direction/mode';

  function takeScreenshotMock(name){
    return fs.readFileSync(__dirname + '/localComparisonProvider/' + name + '.png');
  }

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
      actImagesRoot:'target/localComparisonProvider'},
    logger,runtime);
  storageProvider.onBeforeEachSpec(spec);

  var comparisonConfig = {
    tolerance: 10,
    compare: true
  };
  var comparisonInstanceConfig = {
    ignoreColors: false
  };

  afterAll(function () {
    // remove leftovers
    fs.unlinkSync('target' + imagePath + '/arrow_left.act.png');
    fs.unlinkSync('target' + imagePath + '/arrow_left.diff.png');

    fs.unlinkSync('target' + imagePath + '/drop_down_clean.act.png');
    fs.unlinkSync('target' + imagePath + '/drop_down_clean.diff.png');
  });

  it('Should pass with similar images', function (done) {
    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('arrow_left'),'arrow_left');
    result.pass.promise.then(
      function(passed){
        expect(passed).toBeTruthy();
        done();
      }
    );
  });

  it('Should fail with different images', function(done) {
    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('arrow_left_hover'),'arrow_left');
    result.pass.promise.then(
      function(passed){
        expect(passed).toBe(false);
        done();
      }
    );
  });

  it('Should pass with different images and higher pixel and percentage thresholds', function(done) {
    comparisonConfig.thresholdPixels = 1987;
    comparisonConfig.thresholdPercentage = 0.75;

    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('drop_down_draw'),'drop_down_clean');
    result.pass.promise.then(
      function(passed){
        expect(passed).toBeTruthy();
        done();
      }
    );
  });

  it('Should fail with different images and the lower percentage threshold', function(done) {
    comparisonConfig.thresholdPixels = 1987;
    comparisonConfig.thresholdPercentage = 0.1;

    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('drop_down_draw'),'drop_down_clean');
    result.pass.promise.then(
      function(passed){
        expect(passed).toBe(false);
        done();
      }
    );
  });

  it('Should fail with different images and the lower pixel threshold', function(done) {
    comparisonConfig.thresholdPixels = 200;
    comparisonConfig.thresholdPercentage = 0.75;

    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('drop_down_draw'),'drop_down_clean');
    result.pass.promise.then(
      function(passed){
        expect(passed).toBe(false);
        done();
      }
    );
  });
});
