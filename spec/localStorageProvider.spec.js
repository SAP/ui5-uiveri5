
var fs = require('fs');

describe("LocalStorageProvider", function () {
  var LocalStorageProvider = require('../src/image/localStorageProvider');
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
    testPath: __dirname + '/localStorageProvider/testSpec.spec.js'
  };
  var refImagePath = '/images/testSpec/platform/resolution/browser/theme/direction/mode/arrow_left.ref.png';
  var refImageBuffer;

  it("Should read ref image", function(done) {
    var storageProvider = new LocalStorageProvider({},{refImagesRoot:__dirname + '/localStorageProvider'},logger,runtime);
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
    var storageProvider = new LocalStorageProvider({},{refImagesRoot:'target/localStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeRefImage('arrow_left',refImageBuffer)
      .then(function(imageUrl){
        fs.stat(imageUrl,function(error,stat){
          if(error){
            fail(error);
            done();
          } else {
            expect(stat.size).toBe(1239);
            // remove leftovers
            fs.unlink(imageUrl,function(error){
              if (error){
                fail(error);
              }
              done();
            });
          }
        });
      })
      .catch(function(error){
        fail(error);
        done();
      });
  });

  it("Should store new act image", function(done) {
    var storageProvider = new LocalStorageProvider({},{actImagesRoot:'target/localStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeActImage('arrow_left',refImageBuffer)
      .then(function(imageUrl){
        fs.stat(imageUrl,function(error,stat){
          if(error){
            fail(error);
            done();
          } else {
            expect(stat.size).toBe(1239);
            // remove leftovers
            fs.unlink(imageUrl,function(error){
              if (error){
                fail(error);
              }
              done();
            });
          }
        });
      })
      .catch(function(error){
        fail(error);
        done();
      });
  });

  it("Should store new diff image", function(done) {
    var storageProvider = new LocalStorageProvider({},{actImagesRoot:'target/localStorageProvider'},logger,runtime);
    storageProvider.onBeforeEachSpec(spec);

    storageProvider.storeDiffImage('arrow_left',refImageBuffer)
      .then(function(imageUrl){
        fs.stat(imageUrl,function(error,stat){
          if(error){
            fail(error);
            done();
          } else {
            expect(stat.size).toBe(1239);
            // remove leftovers
            fs.unlink(imageUrl,function(error){
              if (error){
                fail(error);
              }
              done();
            });
          }
        });
      })
      .catch(function(error){
        fail(error);
        done();
      });
  });
});
