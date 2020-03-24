
var fs = require('fs');
var Q = require('q');
Q.longStackSupport = true;

describe("LocalStorageProvider", function () {
  var LocalStorageProvider = require('../src/image/localStorageProvider');
  var logger = require('../src/logger');
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
  var spec = {
    fullName: 'sap.testSpec',
    name: 'testSpec',
    testPath: __dirname + '/localStorageProvider/testSpec.spec.js'
  };
  var refImagePath = '/images/testSpec/platform/resolution/browser/theme/direction/mode/arrow_left.ref.png';
  var refImageBuffer;

  it("Should read ref image", function(done) {
    var storageProvider = new LocalStorageProvider({},
      {refImagesRoot:__dirname + '/localStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.readRefImage('arrow_left').then(function(result){
      refImageBuffer = result.refImageBuffer;
      expect(result.refImageBuffer.length).toEqual(1239);
      expect(result.refImageUrl).toMatch(
        '.*/localStorageProvider' + refImagePath);
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should store new ref image", function(done) {
    var storageProvider = new LocalStorageProvider({},
      {refImagesRoot:'target/localStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeRefImage('arrow_left',refImageBuffer)
      .then(function(res) {
        return Q.ninvoke(fs, 'stat', res.refImageUrl)
          .then(function () {
            return Q.ninvoke(fs, 'unlink', res.refImageUrl);
          });
      })
      .then(function(result){
        done();
      })
      .catch(function(error) {
        fail(error);
        done();
      });
  });

  it("Should store new ref, act and diff image", function(done) {
    var storageProvider = new LocalStorageProvider({},
      {refImagesRoot:'target/localStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeRefActDiffImage('arrow_left',refImageBuffer,refImageBuffer,false)
      .then(function(images) {
        return Q.all([
          Q.ninvoke(fs, 'stat', images.actImageUrl),
          Q.ninvoke(fs, 'stat', images.diffImageUrl)
        ]).then(function () {
          return Q.all([
            Q.ninvoke(fs, 'unlink', images.actImageUrl),
            Q.ninvoke(fs, 'unlink', images.diffImageUrl)
          ]);
        })
      })
      .then(function(result){
        done();
      })
      .catch(function(error) {
        fail(error);
        done();
      });
  });

  it("Should return correctly if image does not exist", function(done) {
    var storageProvider = new LocalStorageProvider({},
      {refImagesRoot:__dirname + '/localStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.readRefImage('not_existing').then(function(result){
      expect(result).toBeNull();
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });
});
