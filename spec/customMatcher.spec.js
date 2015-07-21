/**
 * Created by I304310 on 6/15/2015.
 */
require('jasminewd2');

describe("RemoteSAPUI5SpecResolver", function () {
  beforeEach(function () {
    var comparison = require('../src/imageComparisonMatcher.js')({ignoreColors: true});
    comparison.register();
  });

  it('It should works!', function () {
    expect('spec/People.png').toLookLike('spec/People2.png');
  });

  it('Second test', function() {
    expect('spec/People2.png').toLookLike('spec/People.png');
  });

  it('third test', function() {
    expect('spec/example.png').toLookLike('spec/People.png');
  })
});
