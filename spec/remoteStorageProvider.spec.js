var fs = require('fs');
var storageMock = require('./remoteStorageProvider/remoteStorageMock')();

describe("RemoteStorageProvider", function () {
  var RemoteStorageProvider = require('../src/image/remoteStorageProvider');

  var logger = require('../src/logger')(3);
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
    testPath: __dirname + '/remoteStorageProvider/testSpec.spec.js',
    branch: 'master',
    lib: 'sap.m'
  };

  var refImageRoot = __dirname + '/../target';
  var imageBuffer = new Buffer(fs.readFileSync('./spec/remoteStorageProvider/arrow_left.png'));
  var imageStorageMockUrl = 'http://localhost';
  var initialImgName = 'initial';
  var lnkPath = __dirname + '/../target/images/testSpec/platform/resolution/browser/theme/direction/mode/' +
    initialImgName;

  beforeAll(function(done) {
    process.env.NO_PROXY = process.env.NO_PROXY ? '' : 'localhost';
    storageMock.start().then(function(port) {
      imageStorageMockUrl += ':' + port;
      done();
    });
  });

  it("Should store new ref image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot: refImageRoot, imageStorageUrl: imageStorageMockUrl},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeRefImage(initialImgName, imageBuffer)
      .then(function(result) {
        expect(result).toMatch(
          '.*/images/*');
        expect(fs.statSync(lnkPath + '.ref.lnk').isFile()).toBe(true);
        done();
      }).catch(function(error){
        fail(error);
        done()
      });
  });

  it("Should read ref image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot: refImageRoot, imageStorageUrl: imageStorageMockUrl},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.readRefImage(initialImgName)
      .then(function(result) {
        expect(result.refImageBuffer.length).toBe(1239);
        expect(result.refImageUrl).toMatch(
          '.*/images/*');
        fs.unlink(lnkPath + '.ref.lnk',function(error){
          if (error){
            fail(error);
          }
          done();
        });
      }).catch(function(error){
        fail(error);
        done()
      });
  });

  it("Should store new act image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot: refImageRoot, imageStorageUrl: imageStorageMockUrl},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeActImage(initialImgName, imageBuffer)
      .then(function(result) {
        expect(result).toMatch(
          '.*/images/*');
        done();
      }).catch(function(error){
        fail(error);
        done()
      });
  });

  it("Should store new diff image", function(done) {
    var storageProvider = new RemoteStorageProvider({},
      {refImagesRoot: refImageRoot, imageStorageUrl: imageStorageMockUrl},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeDiffImage(initialImgName, imageBuffer)
      .then(function(result) {
        expect(result).toMatch(
          '.*/images/*');
        done();
      }).catch(function(error){
        fail(error);
        done()
      });
  });
});
