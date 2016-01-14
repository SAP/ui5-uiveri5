var fs = require('fs');
var storageMock = require('./remoteStorageProvider/remoteStorageMock.js')();

describe("RemoteStorageProvider", function () {
  beforeAll(function(done) {
    storageMock.start().then(function() {
      done();
    });
  });

  var RemoteStorageProvider = require('../src/image/remoteStorageProvider');

  var logger = require('../src/logger')(3);
  var runtime = {
    platformName: 'platform',
    platformVersion: '7',
    platformResolution: 'resolution',
    browserName: 'browser',
    browserVersion: '*',
    ui5: {
      theme: 'theme',
      direction: 'direction',
      mode: 'mode'
    }
  };
  var spec = {
    fullName: 'sap.testSpec',
    name: 'testSpec',
    testPath: __dirname + '/remoteStorageProvider/testSpec.spec.js',
    branch: 'master',
    lib: 'sap.m'
  };

  var initialImgName = 'initial';
  var imagePath = './spec/remoteStorageProvider/arrow_left.png';
  var content = fs.readFileSync(imagePath);
  var imageBuffer = new Buffer(content);

  it("Should store new ref image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot:__dirname + '/remoteStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeRefImage(initialImgName, imageBuffer)
      .then(function(result) {
        expect(result.refImageUrl).toMatch(
          '.*/images/' + '*');
        done();
      }).catch(function(error){
        fail(error);
        done()
      });
  });

  it("Should read ref image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot:__dirname + '/remoteStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.readRefImage(initialImgName)
      .then(function(result) {
        expect(result.refImageBuffer.length).toBeGreaterThan(10);
        expect(result.refImageUrl).toMatch(
          '.*/images/'  + "*");
        done()
      }).catch(function(error){
        fail(error);
        done()
      });
  });

  it("Should store new act image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot:__dirname + '/remoteStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeActImage(initialImgName, imageBuffer)
      .then(function(result) {
        expect(result.actImageUrl).toMatch(
          '.*/images/' + '*');
        done();
      }).catch(function(error){
        fail(error);
        done()
      });
  });

  it("Should store new diff image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot:__dirname + '/remoteStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeDiffImage(initialImgName, imageBuffer)
      .then(function(result) {
        expect(result.diffImageUrl).toMatch(
          '.*/images/' + '*');
        done();
      }).catch(function(error){
        fail(error);
        done()
      });
  });
});
