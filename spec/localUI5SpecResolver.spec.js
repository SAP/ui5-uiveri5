
describe("LocalUI5SpecResolver", function () {
  var LocalUI5SpecResolver = require('../src/resolver/localUI5SpecResolver');
  var logger = require('../src/logger')(3);

  it("Should resolve specs in open5", function() {
    var specResolver = new LocalUI5SpecResolver(
      {},{suiteRootPath: __dirname + '/localUI5SpecResolver/openui5'},logger);
    var specs = specResolver.resolve();
    expect(specs[0]).toEqual({name:'Comp1',fullName:'sap.m.Comp1',
      testPath: __dirname.replace(/\\/g,'/') + '/localUI5SpecResolver/openui5/src/sap.m/test/sap/m/visual/Comp1.spec.js',
      contentUrl:'http://localhost:8080/testsuite/test-resources/sap/m/Comp1.html'});
  });

  it("Should resolve specs in ui5 contributor projects", function() {
    var specResolver = new LocalUI5SpecResolver(
      {},{suiteRootPath: __dirname + '/localUI5SpecResolver/sap.gantt'},logger);
    var specs = specResolver.resolve();
    expect(specs[0]).toEqual({name:'Comp1',fullName:'sap.gantt.Comp1',
      testPath: __dirname.replace(/\\/g,'/') + '/localUI5SpecResolver/sap.gantt/gantt.lib/test/sap/gantt/visual/Comp1.spec.js',
      contentUrl:'http://localhost:8080/testsuite/test-resources/sap/gantt/Comp1.html'});
  });
});
