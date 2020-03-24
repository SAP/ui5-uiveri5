
var fs = require('fs');
var LocalStorageProvider = require('../src/image/localStorageProvider.js');
var LocalComparisonProvider = require('../src/image/localComparisonProvider.js');

describe("LocalComparisonProvider", function () {
  var logger = require('../src/logger');
  var matchers = {};
  var imagePath = '/localComparisonProvider/images/testSpec/platform/resolution/browser/theme/direction/mode';

  function takeScreenshotMock(name){
    var file = __dirname + '/localComparisonProvider/' + name + '.png';
    logger.debug('takeScreenshotMock: read: ' + file);
    return fs.readFileSync(file);
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

    fs.unlinkSync('target' + imagePath + '/calendar_ref.act.png');
    fs.unlinkSync('target' + imagePath + '/calendar_ref.diff.png');
  });

  it('Should pass with similar images', function (done) {
    var comparisonProvider = new LocalComparisonProvider(
      comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('arrow_left'),'arrow_left');
    result.pass.then(
      function(passed){
        expect(passed).toBeTruthy();
        done();
      }
    );
  });

  it('Should fail with different images', function(done) {
    var comparisonProvider = new LocalComparisonProvider(
      comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('arrow_left_hover'),'arrow_left');
    result.pass.then(
      function(passed){
        expect(passed).toBe(false);
        done();
      }
    );
  });

  it('Should pass with different images and higher pixel and percentage thresholds', function(done) {
    comparisonConfig.ignoreNothing = false;
    comparisonConfig.thresholdPixels = 1987;
    comparisonConfig.thresholdPercentage = 0.75;

    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('drop_down_draw'),'drop_down_clean');
    result.pass.then(
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
    result.pass.then(
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
    result.pass.then(
      function(passed){
        expect(passed).toBe(false);
        done();
      }
    );
  });

  it('Should fail when color difference is small (ignore nothing option of resemble.js)', function(done) {
    comparisonConfig.ignoreNothing = true;

    var comparisonProvider = new LocalComparisonProvider(comparisonConfig,comparisonInstanceConfig,logger,storageProvider);
    comparisonProvider.register(matchers);

    var result = matchers.toLookAs().compare(takeScreenshotMock('calendar_act'),'calendar_ref');
    result.pass.then(function(passed){
      expect(passed).toBe(false);
      done();
    });
  });

  it('Should handle image parsing errors', function (done) {
    var invalidBuffer = new Buffer('not an actual png', 'utf8');
    var comparisonProvider = new LocalComparisonProvider(
      comparisonConfig, comparisonInstanceConfig, logger, storageProvider);

    comparisonProvider.register(matchers);
    var result = matchers.toLookAs().compare(invalidBuffer, 'arrow_left');
    result.pass.then(function (passed) {
      expect(passed).toBe(false);
      expect(result.message).toContain('Image comparison failed, error: Error while parsing image buffer: Error: Invalid file signature');
      done();
    });
  });
});
