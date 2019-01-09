
describe("LocalSpecResolver", function () {
  var LocalSpecResolver = require('../src/resolver/localSpecResolver');
  var logger = require('../src/logger')(3);

  it("Should resolve specs", function(done) {
    var specResolver = new LocalSpecResolver(
      {specs: __dirname + '/localSpecResolver/*.spec.js'},{},logger);
    specResolver.resolve().then(function(specs){
      expect(specs[0]).toEqual({name:'test',fullName:'test',
       testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test.spec.js',
       contentUrl: undefined});
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should exclude test specs", function(done) {
    var specResolver = new LocalSpecResolver(
      {specs: __dirname + '/localSpecResolver/*.spec.js', specExclude: 'test2'},{},logger);
    specResolver.resolve().then(function(specs){
      expect(specs[0]).toEqual({name:'test',fullName:'test',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test.spec.js',
        contentUrl: undefined});
      expect(specs[1]).toEqual({name:'test3',fullName:'test3',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test3.spec.js',
        contentUrl: undefined});
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });
});
