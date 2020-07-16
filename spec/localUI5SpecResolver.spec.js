
describe("LocalUI5SpecResolver", function () {
  var LocalUI5SpecResolver = require('../src/resolver/localUI5SpecResolver');
  var logger = require('../src/logger');

  it("Should resolve specs in openui5 project", function(done) {
    var specResolver = new LocalUI5SpecResolver(
      {branch: 'overwrite'},{suiteRootPath: __dirname + '/localUI5SpecResolver/openui5'},logger);
    specResolver.resolve().then(function(specs){
      expect(specs[0]).toEqual({name:'Comp1',fullName:'sap.m.Comp1',lib: 'sap.m',branch: 'overwrite',
       testPath: __dirname.replace(/\\/g,'/') + '/localUI5SpecResolver/openui5/src/sap.m/test/sap/m/visual/Comp1.spec.js',
       contentUrl:'http://localhost:8080/test-resources/sap/m/Comp1.html'});
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should resolve specs in ui5 contributor projects", function(done) {
    var specResolver = new LocalUI5SpecResolver(
      {branch: 'overwrite'},{suiteRootPath: __dirname + '/localUI5SpecResolver/sap.gantt'},logger);
    specResolver.resolve().then(function(specs){
      expect(specs[0]).toEqual({name:'Comp1',fullName:'sap.gantt.Comp1',lib: 'sap.gantt',branch: 'overwrite',
        testPath: __dirname.replace(/\\/g,'/') + '/localUI5SpecResolver/sap.gantt/gantt.lib/test/sap/gantt/visual/Comp1.spec.js',
        contentUrl:'http://localhost:8080/test-resources/sap/gantt/Comp1.html'});
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should filter out unnecessary specs", function(done) {
    var specResolver = new LocalUI5SpecResolver(
      {branch: 'overwrite',specFilter: 'Comp11,Comp2'},{suiteRootPath: __dirname + '/localUI5SpecResolver/openui5'},logger);
    specResolver.resolve().then(function(specs){
      expect(specs.length).toEqual(2);
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should filter specs only with spec filter", function(done) {
    var specResolver = new LocalUI5SpecResolver(
      {branch: 'overwrite',specFilter: 'Comp1'},{suiteRootPath: __dirname + '/localUI5SpecResolver'},logger);
    specResolver.resolve().then(function(specs){
      expect(specs.length).toEqual(2);
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should filter specs only with spec exclude", function(done) {
    var specResolver = new LocalUI5SpecResolver(
      {branch: 'overwrite',specExclude: 'Comp11'},{suiteRootPath: __dirname + '/localUI5SpecResolver'},logger);
    specResolver.resolve().then(function(specs){
      expect(specs.length).toEqual(3);
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });

  it("Should filter specs only with lib filter", function(done) {
    var specResolver = new LocalUI5SpecResolver(
      {branch: 'overwrite',libFilter: 'sap.m,sap.gantt'},{suiteRootPath: __dirname + '/localUI5SpecResolver'},logger);
    specResolver.resolve().then(function(specs){
      expect(specs.length).toEqual(4);
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });
});
