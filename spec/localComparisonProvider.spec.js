
var fs = require('fs');
require('jasminewd2');

describe("LocalComparisonProvider", function () {
  var logger = require('../src/logger')(3);

  beforeAll(function () {
    var storageProviderMock = {
      readRefImage: function(refImageName) {
        return fs.createReadStream(__dirname + '/localComparisonProvider/' + refImageName);
      },
      storeRefImage : function(refImageName) {
        //return fs.createWriteStream(refImageName);
      },
      storeDiffImage : function() {
        //return fs.createWriteStream('spec/localComparisonProvider/diff.png');
      },
      storeActImage : function() {
        //return fs.createWriteStream('spec/localComparisonProvider/act.png');
      }
    };

    var config = {
      tolerance: 10,
      compare: true
    };
    var instanceConfig = {
      ignoreColors: false
    };

    var LocalComparisonProvider = require('../src/image/localComparisonProvider.js');
    var comparisonProvider = new LocalComparisonProvider(config,instanceConfig,logger,storageProviderMock);

    var matchers = {};
    comparisonProvider.register(matchers);
    jasmine.getEnv().addMatchers(matchers);
  });

  it('Should pass with similar images', function () {
    var imageFile = fs.readFileSync(__dirname + '/localComparisonProvider/Original.png').toString('base64');
    expect(imageFile).toLookAs('Similar.png');
  });

  it('Should fail with different images', function() {
    var imageFile = fs.readFileSync(__dirname + '/localComparisonProvider/Original.png').toString('base64');
    expect(imageFile).not.toLookAs('Different.png');
  });
});
