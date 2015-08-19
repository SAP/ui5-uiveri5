/**
 * Created by I304310 on 6/15/2015.
 */
require('jasminewd2');
var fs = require('fs');

describe("RemoteSAPUI5SpecResolver", function () {
  beforeEach(function () {
    var storageProvider = 'local';
    var comparison = require('../src/imageComparisonMatcher.js')(
      {
        imageComparison: {
          ignoreColors: true,
          tolerance: 10,
          take: true,
          compare: true
        }
      },
      storageProvider
    );

    comparison.register();
  });

  it('Should have mismatch percentage above 10%.', function () {
    var imageBuffer = fs.readFileSync('spec/People.png')
    expect(imageBuffer).toLookLike('spec/People2.png');
  });

  it('Should have mismatch percentage above 10%.', function() {
    var imageBuffer = fs.readFileSync('spec/People2.png');
    expect(imageBuffer).toLookLike('spec/People.png');
  });

  it('Should not look like the ref image.', function() {
    var imageBuffer = fs.readFileSync('spec/example.png');
    expect(imageBuffer).not.toLookLike('spec/People.png');
  })
});
