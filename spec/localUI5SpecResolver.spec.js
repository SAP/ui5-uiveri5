
describe("LocalUI5SpecResolver", function () {
  var LocalUI5SpecResolver = require('../src/resolver/localUI5SpecResolver');
  var logger = require('../src/logger')(3);

  it("Should resolve specs in open5", function() {
    var specResolver = new LocalUI5SpecResolver(
      {},{suiteRootPath: __dirname + '/localUI5SpecResolver/openui5'},logger);
    var specs = specResolver.resolve();
    expect(specs[0]).toEqual(jasmine.objectContaining({name:'Comp1',fullName:'sap.m.Comp1'}));
  });

  it("Should resolve specs in ui5 contributor projects", function() {
    var specResolver = new LocalUI5SpecResolver(
      {},{suiteRootPath: __dirname + '/localUI5SpecResolver/sap.gantt'},logger);
    var specs = specResolver.resolve();
    expect(specs[0]).toEqual(jasmine.objectContaining({name:'Comp1',fullName:'gantt.lib.Comp1'}));
  });
});
