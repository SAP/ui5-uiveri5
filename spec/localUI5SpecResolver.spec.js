
describe("LocalUI5SpecResolver", function () {
  var LocalUI5SpecResolver = require('../src/resolver/localUI5SpecResolver');
  var logger = require('../src/logger')(3);

  it("Should resolve specs in openui5 project", function(done) {
    var specResolver = new LocalUI5SpecResolver(
      {branch: 'overwrite'},{suiteRootPath: __dirname + '/localUI5SpecResolver/openui5'},logger);
    specResolver.resolve().then(function(specs){
      expect(specs[0]).toEqual({name:'Comp1',fullName:'sap.m.Comp1',lib: 'sap.m',branch: 'overwrite',
       testPath: __dirname.replace(/\\/g,'/') + '/localUI5SpecResolver/openui5/src/sap.m/test/sap/m/visual/Comp1.spec.js',
       contentUrl:'http://localhost:8080/testsuite/test-resources/sap/m/Comp1.html'});
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
        contentUrl:'http://localhost:8080/testsuite/test-resources/sap/gantt/Comp1.html'});
      done();
    }).catch(function(error){
      fail(error);
      done();
    });
  });
});
