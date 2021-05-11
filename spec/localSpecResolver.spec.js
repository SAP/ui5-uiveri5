
describe("LocalSpecResolver", function () {
  var LocalSpecResolver = require('../src/resolver/localSpecResolver');
  var logger = require('../src/logger');

  it("Should resolve specs", function(done) {
    var specResolver = new LocalSpecResolver(
      {specs: __dirname + '/localSpecResolver/*.spec.js'},{},logger);
    specResolver.resolve().then(function(specs){
      expect(specs.length).toEqual(3);
      expect(specs[0]).toEqual({name:'test',fullName:'test',
       testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test.spec.js',
       contentUrl: undefined});
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should resolve specs in folder with dot in the name", function (done) {
    var specResolver = new LocalSpecResolver({
      specs: __dirname + '/localSpecResolver/folder.test/*.spec.js'
    }, {}, logger);
    specResolver.resolve().then(function (specs) {
      expect(specs.length).toEqual(1);
      expect(specs[0]).toEqual({
        name: 'test',
        fullName: 'test',
        testPath: __dirname.replace(/\\/g, '/') + '/localSpecResolver/folder.test/test.spec.js',
        contentUrl: undefined
      });
      done();
    }).catch(function (error) {
      fail(error);
      done();
    });
  });

  it("Should resolve array of specs", function (done) {
    var specResolver = new LocalSpecResolver({
      specs: [
        __dirname + '/localSpecResolver/*2.spec.js',
        __dirname + '/localSpecResolver/*3.spec.js',
        __dirname + '/localSpecResolver/*3.spec.js' // duplicate path
    ]}, {}, logger);
    specResolver.resolve().then(function (specs) {
      expect(specs.length).toEqual(2);
      expect(specs[0]).toEqual({
        name:'test2',
        fullName:'test2',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test2.spec.js',
        contentUrl: undefined
      });
      expect(specs[1]).toEqual({
        name:'test3',
        fullName:'test3',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test3.spec.js',
        contentUrl: undefined
      });
      done();
    }).catch(function (error) {
      fail(error);
      done();
    });
  });

  it("Should resolve suites of specs", function (done) {
    var specResolver = new LocalSpecResolver({
      specs: {
        main: __dirname + '/localSpecResolver/*2.spec.js',
        detail: [__dirname + '/localSpecResolver/*3.spec.js']
      }
    }, {}, logger);
    specResolver.resolve().then(function (specs) {
      expect(specs.length).toEqual(2);
      expect(specs[0]).toEqual({
        name:'test2',
        fullName:'test2',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test2.spec.js',
        contentUrl: undefined
      });
      expect(specs[1]).toEqual({
        name:'test3',
        fullName:'test3',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test3.spec.js',
        contentUrl: undefined
      });
      done();
    }).catch(function (error) {
      fail(error);
      done();
    });
  });

  it("Should exclude test specs", function(done) {
    var specResolver = new LocalSpecResolver(
      {specs: __dirname + '/localSpecResolver/*.spec.js', specExclude: 'test2'},{},logger);
    specResolver.resolve().then(function(specs){
      expect(specs.length).toEqual(2);
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

  it("Should filter test specs", function (done) {
    var specResolver = new LocalSpecResolver({
      specs: __dirname + '/localSpecResolver/*.spec.js',
      specFilter: 'test2'
    }, {}, logger);
    specResolver.resolve().then(function (specs) {
      expect(specs.length).toEqual(1);
      expect(specs[0]).toEqual({
        name:'test2',
        fullName:'test2',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test2.spec.js',
        contentUrl: undefined
      });
      done();
    }).catch(function (error) {
      fail(error);
      done();
    });
  });

  it("Should exclude suites", function(done) {
    var specResolver = new LocalSpecResolver({
      specs: {
        main: __dirname + '/localSpecResolver/*.spec.js',
        detail: [
          __dirname + '/localSpecResolver/*3.spec.js'
        ]
      },
      suiteExclude: 'main'
    }, {}, logger);
    specResolver.resolve().then(function (specs) {
      expect(specs.length).toEqual(1);
      expect(specs[0]).toEqual({
        name:'test3',
        fullName:'test3',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test3.spec.js',
        contentUrl: undefined
      });
      done();
    }).catch(function (error) {
      fail(error);
      done();
    });
  });

  it("Should filter suites", function(done) {
    var specResolver = new LocalSpecResolver({
      specs: {
        main: __dirname + '/localSpecResolver/*.spec.js',
        detail: [
          __dirname + '/localSpecResolver/*3.spec.js'
        ]
      },
      suiteFilter: 'detail'
    }, {}, logger);
    specResolver.resolve().then(function (specs) {
      expect(specs.length).toEqual(1);
      expect(specs[0]).toEqual({
        name:'test3',
        fullName:'test3',
        testPath: __dirname.replace(/\\/g,'/') + '/localSpecResolver/test3.spec.js',
        contentUrl: undefined
      });
      done();
    }).catch(function (error) {
      fail(error);
      done();
    });
  });
});
