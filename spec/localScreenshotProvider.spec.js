var fs = require('fs');
var Q = require('q');
var logger = require('../src/logger');

//browser = {
//  takeScreenshot: function() {
//    return Q.Promise().resolve();
//  }
//};
var LocalScreenshotProvider = require('../src/image/localScreenshotProvider');
var config = {take: true};
var instanceConfig = {};
var runtime = {
  capabilities: {
    remoteWebDriverOptions: {

    }
  }
};
var screenshotProvider = new LocalScreenshotProvider(config, instanceConfig, logger, runtime);

describe('LocalScreenshotProvider', function() {
  it('Should fail to crop screenshot with height=0', function(done){
    var element = {
      getSize: function() {
        return Q.Promise.resolve({
          width: 100,
          height: 100
        });
      },
      getLocation: function() {
        return Q.Promise.resolve({
          y: -100,
          x: 1
        });
      }
    };

    fs.readFile('spec/localScreenshotProvider/browserScreenshot.png', function(error, buffer) {
      screenshotProvider._cropScreenshot(buffer.toString('base64'), element).then(function(){
      }, function(error){
        expect(error.message).toBe('Requested element for crop is placed partially or fully outside the viewport. In display pixels element width=100, height=0, left=1, top=0');
        done();
      });
    });
  });

  it('Should fail to crop screenshot with height=-10', function(done){
    var element = {
      getSize: function() {
        return Q.Promise.resolve({
          width: 100,
          height: 100
        });
      },
      getLocation: function() {
        return Q.Promise.resolve({
          y: -110,
          x: 1
        });
      }
    };

    fs.readFile('spec/localScreenshotProvider/browserScreenshot.png', function(error, buffer) {
      screenshotProvider._cropScreenshot(buffer.toString('base64'), element).then(function(){
      }, function(error){
        expect(error.message).toBe('Cannot crop element because is outside of the view port. View port in display pixels: width=635, height=421. Element properties in display pixels: width=100, height=100, left=1, top=-110');
        done();
      });
    });
  });
});
