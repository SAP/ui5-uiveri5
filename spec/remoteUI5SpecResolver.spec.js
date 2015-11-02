
describe("RemoteUI5SpecResolver", function () {

  var proxyquire = require('proxyquire');
  var logger = require('../src/logger')(3);

  var specFolder = __dirname + '/remoteUI5SpecResolver/target/specs/';
  var RemoteUI5SpecResolver;

  beforeEach(function(){
    var appInfo = {
      name: 'demokit',
      libraries: [{
        name: 'sap.m'
      },{
        name: 'sap.ui'
      }]
    };
    var requestStub = {
      request: function(url){
        if(url.indexOf('sap-ui-version.json')!==-1){
          return {data:JSON.stringify(appInfo)};
        } else if (url.indexOf('visual.suite.js')!==-1){
          return {status:200,data:''};
        } else if (url.indexOf('spec.js')!==-1){
          return {status:200,data:''};
        }
      }
    };
    var fsStub = {
      existsSync : function(){
        return true;
      },
      writeFileSync: function () {
        return true;
      },
      mkdirSync: function () {
        return true;
      }
    };
    RemoteUI5SpecResolver = proxyquire("../src/resolver/remoteUI5SpecResolver.js",{
      'urllib-sync': requestStub,
      'fs':fsStub
    });
  });

  it("Should resolve specs", function () {
    var specResolver = new RemoteUI5SpecResolver(
      {},{specsFolder:specFolder},logger);

    var specs = specResolver.resolve();

    expect(specs.length).toEqual(2);
    expect(specs[0]).toEqual(jasmine.objectContaining({name:'Comp1',fullName:'sap.m.Comp1',
      testPath: __dirname + '\\remoteUI5SpecResolver\\target\\specs\\sap.m\\Comp1.spec.js',
      contentUrl:'http://localhost:8080/testsuite/test-resources/sap/m/Comp1.html'}));
  });

  it("Should filter specs by spec name", function () {
    var specResolver = new RemoteUI5SpecResolver(
      {specFilter: 'Comp1'},{specsFolder:specFolder},logger);

    var specs = specResolver.resolve();

    expect(specs.length).toEqual(1);
    expect(specs[0]).toEqual(jasmine.objectContaining({name:'Comp1'}));
  });

  it("Should filter specs by lib name", function () {
    var specResolver = new RemoteUI5SpecResolver(
      {libFilter:'sap.ui'},{specsFolder:specFolder},logger);

    var specs = specResolver.resolve();

    expect(specs.length).toEqual(1);
    expect(specs[0]).toEqual(jasmine.objectContaining({name:'Comp2'}));
  });
});
