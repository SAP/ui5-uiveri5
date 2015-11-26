
var fs = require('fs');

describe("LocalStorageProvider", function () {
  var LocalStorageProvider = require('../src/image/localStorageProvider');
  var logger = require('../src/logger')(3);
  var runtime = {
    platformName: 'platform',
    platformResolution: 'resolution',
    browserName: 'chrome',
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
  var imagePath = '/images/testSpec/platform/resolution/chrome/theme/direction/mode';
  var refImagePath = imagePath + '/test.ref.png';
  var actImagePath = imagePath + '/test.act.png';
  var diffImagePath = imagePath + '/test.diff.png';
  var refImageBuffer;

  it("Should read ref image", function(done) {
    var storage = new LocalStorageProvider({},{refImagesRoot:__dirname + '/localStorageProvider'},logger,runtime);
    storage.onBeforeEachSpec(spec);

    storage.readRefImage('test').then(function(result){
      refImageBuffer = result.refImageBuffer;
      expect(result.refImageBuffer.length).toEqual(50161);
      expect(result.refImageUrl).toMatch(
        '.*/localStorageProvider' + refImagePath);
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should store new ref image", function(done) {
    var storage = new LocalStorageProvider({},{refImagesRoot:'target'},logger,runtime);
    storage.onBeforeEachSpec(spec);

    // remove leftovers from previous executions
    fs.unlink('target' + refImagePath,function(error){
      if(error) {
        fail(error);
      }
    });

    storage.storeRefImage('test',refImageBuffer)
      .then(function(imageUrl){
        fs.stat('target' + refImagePath,function(error,stat){
          if(error){
            fail(error);
            done();
          } else {
            expect(stat.size).toBe(50161);
            done();
          }
        });
      })
      .catch(function(error){
        fail(error);
        done();
      });
  });

  it("Should store new act image", function() {
    var storage = new LocalStorageProvider({},{},logger,runtime);
    storage.onBeforeEachSpec(spec);

    // remove leftovers from previous executions
    fs.unlink('target' + actImagePath,function(error){
      if(error) {
        fail(error);
      }
    });

    storage.storeActImage('test',refImageBuffer)
      .then(function(imageUrl){
        fs.stat('target' + refImagePath,function(error,stat){
          if(error){
            fail(error);
            done();
          } else {
            expect(stat.size).toBe(50161);
            done();
          }
        });
      })
      .catch(function(error){
        fail(error);
        done();
      });
  });

  it("Should store new diff image", function() {
    var storage = new LocalStorageProvider({},{},logger,runtime);
    storage.onBeforeEachSpec(spec);

    // remove leftovers from previous executions
    fs.unlink('target' + diffImagePath,function(error){
      if(error) {
        fail(error);
      }
    });

    storage.storeDiffImage('test',refImageBuffer)
      .then(function(imageUrl){
        fs.stat('target' + diffImagePath,function(error,stat){
          if(error){
            fail(error);
            done();
          } else {
            expect(stat.size).toBe(50161);
            done();
          }
        });
      })
      .catch(function(error){
        fail(error);
        done();
      });
  });
});
