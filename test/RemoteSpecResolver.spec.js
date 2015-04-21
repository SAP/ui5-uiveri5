describe("RemoteSAPUI5SpecResolver", function() {

  var proxyquire = require('proxyquire');

  it("Should get suite paths.", function() {
    var oAppInfo = {
      name: 'demokit',
      version: '1.29.0-SNAPSHOT',
      buildTimestamp: '',
      scmRevision: '',
      gav: 'com.sap.ui5:demokit:1.29.0-SNAPSHOT:war',
      libraries:
        [ { name: 'sap.ui.core',
          version: '1.29.0-SNAPSHOT',
          buildTimestamp: '201504140013',
          scmRevision: '9f6fd63d4a2d0b11e91822af9059eaf2ca63298c',
          gav: 'com.sap.ui5:core:1.29.0-SNAPSHOT:jar' },
          { name: 'sap.m',
            version: '1.29.0-SNAPSHOT',
            buildTimestamp: '201504140013',
            scmRevision: '9f6fd63d4a2d0b11e91822af9059eaf2ca63298c',
            gav: 'com.sap.ui5:mobile:1.29.0-SNAPSHOT:jar' } ]
    };

    var requestStub = {};
    var SpecResolverFile = proxyquire("../src/remoteSAPUI5SpecResolver.js", {'urllib-sync' : requestStub});
    var specResolver = new SpecResolverFile({});

    var aPaths = specResolver._getSuitePaths(oAppInfo);

    expect(aPaths.length).toBe(2);
    expect(aPaths[0].pathUrl).toEqual("http://localhost:8080/testsuite/test-resources/sap/ui/core/visual/visual.suite.js");
    expect(aPaths[1].pathUrl).toEqual("http://localhost:8080/testsuite/test-resources/sap/m/visual/visual.suite.js");
  });

  it("Should download json file to test directory, and return array.", function() {
    var oSuitesMockData = {
      type: 'buffer',
      status: 200,
      headers:
      { 'access-control-allow-origin': '*',
        vary: 'Origin',
        'accept-ranges': 'bytes',
        date: 'Mon, 20 Apr 2015 13:44:53 GMT',
        'cache-control': 'public, max-age=0',
        'last-modified': 'Mon, 20 Apr 2015 10:29:52 GMT',
        etag: 'W/"af-2723698073"',
        'content-type': 'application/javascript',
        'content-length': '175',
        connection: 'keep-alive' },
      data: 'sap.m.ActionSelect'
    };

    var requestStub = {
      request : function(path) {
        return oSuitesMockData;
      }
    };

    var isWritten = false;
    var isCreatedFolder = false;

    var fsStub = {
      writeFileSync : function() {
        isWritten = true;
      },
      mkdirSync : function() {
        isCreatedFolder = true;
      }
    };

    var SpecResolverFile = proxyquire("../src/remoteSAPUI5SpecResolver.js", {
      'urllib-sync' : requestStub,
      'fs' : fsStub
    });

    var specResolver = new SpecResolverFile({});

    var oPaths = [{
      pathUrl: 'http://veui5infra.dhcp.wdf.sap.corp:8080/demokit/resources/sap-ui-version.json',
      targetFolder: 'test/target/test-download/'
    }];

    var aResultPaths = specResolver._downloadFiles(oPaths, oPaths.targetFolder);

    expect(isWritten).toBe(true);
    expect(isCreatedFolder).toBe(true);
    expect(aResultPaths[0].pathUrl.indexOf("sap-ui-version.json") != -1).toBe(true);
  });

  it("Should load given spec and return specs array. Check array's lenght and if the spec name is the same as given.", function() {
    var aSuites = [{
      pathUrl: 'http://localhost:8080/testsuite/test-resources/sap/m/visual/visual.suite.js',
      targetFolder: 'target/specs/sap.m/'
    }];

    var oSpecMockData = { type: 'buffer',
        status: 200,
        headers:
        { 'access-control-allow-origin': '*',
          vary: 'Origin',
          'accept-ranges': 'bytes',
          date: 'Mon, 20 Apr 2015 14:10:47 GMT',
          'cache-control': 'public, max-age=0',
          'last-modified': 'Wed, 01 Apr 2015 12:56:25 GMT',
          etag: 'W/"b12-568638981"',
          'content-type': 'application/javascript',
          'content-length': '2834',
          connection: 'keep-alive' },
        data: 'Spec file mock data' };

    var requestStub = {
      request : function(path) {
        return oSpecMockData;
      }
    };

    var isWritten = false;
    var isCreatedFolder = false;

    var fsStub = {
      writeFileSync : function() {
        isWritten = true;
      },
      mkdirSync : function() {
        isCreatedFolder = true;
      }
    };

    var SpecResolverFile = proxyquire("../src/remoteSAPUI5SpecResolver.js", {
      'urllib-sync' : requestStub,
      'fs' : fsStub
    });

    var specResolver = new SpecResolverFile({});

    var aSpecs = specResolver._loadSpecs(aSuites);

    expect(isWritten).toBe(true);
    expect(isCreatedFolder).toBe(true);
    expect(aSpecs.length).toBe(1);
    expect(aSpecs[0].name).toEqual("sap.m.ActionSelect");
  });
});
