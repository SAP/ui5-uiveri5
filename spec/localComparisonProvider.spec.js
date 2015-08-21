/**
 * Created by I304310 on 6/15/2015.
 */

var fs = require('fs');
require('jasminewd2');

describe("RemoteSAPUI5SpecResolver", function () {
  beforeEach(function () {

    var storageProviderMock = {
      storeRefImage : function(refImageName) {
        return fs.createWriteStream(refImageName);;
      },
      readRefImage: function(refImageName) {
        var readImageStream = fs.createReadStream(refImageName);
        readImageStream.on('error', function(error) {
          return null;
        });
        return readImageStream;
      },
      storeDiffImage : function() {
        return fs.createWriteStream('spec/localComparisonProvider/diff.png');
      },
      storeActImage : function() {
        return fs.createWriteStream('spec/localComparisonProvider/act.png');
      }
    };

    var config = {
      tolerance: 10,
      compare: true,
      localComparisonProvider: {
        update: false,
        ignoreColors: false
      }
    };

    var comparison = require('../src/localComparisonProvider.js')(
      config,
      storageProviderMock
    );

    comparison.register();
  });

  it('Should have mismatch percentage less than 10%.', function () {
    var imageFile = fs.readFileSync('spec/localComparisonProvider/People.png').toString('base64');
    expect(imageFile).toLookAs('spec/localComparisonProvider/People2.png');

  });

  it('Should have mismatch percentage less than 10%.', function() {
    var imageFile = fs.readFileSync('spec/localComparisonProvider/People2.png').toString('base64');
    expect(imageFile).toLookAs('spec/localComparisonProvider/People.png');
  });

  it('Should not look like the ref image - mismatch percentage more than 10%.', function() {
    var imageFile = fs.readFileSync('spec/localComparisonProvider/example.png').toString('base64');
    expect(imageFile).not.toLookAs('spec/localComparisonProvider/People.png');
  });

  it('Should cannot find the reference image.', function() {
    var imageFile = fs.readFileSync('spec/localComparisonProvider/example.png').toString('base64');
    expect(imageFile).not.toLookAs('spec/localComparisonProvider/doNotExist.png');
  });

});
