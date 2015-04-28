describe("RemoteSAPUI5SpecResolver", function () {

  var proxyquire = require('proxyquire');

  it("Should get suite paths.", function () {
    var oAppInfo = {
      name: 'demokit',
      version: '1.29.0-SNAPSHOT',
      buildTimestamp: '',
      scmRevision: '',
      gav: 'com.sap.ui5:demokit:1.29.0-SNAPSHOT:war',
      libraries: [
        {
          name: 'sap.ui.core',
          version: '1.29.0-SNAPSHOT',
          buildTimestamp: '201504140013',
          scmRevision: '9f6fd63d4a2d0b11e91822af9059eaf2ca63298c',
          gav: 'com.sap.ui5:core:1.29.0-SNAPSHOT:jar'
        }, {
          name: 'sap.m',
          version: '1.29.0-SNAPSHOT',
          buildTimestamp: '201504140013',
          scmRevision: '9f6fd63d4a2d0b11e91822af9059eaf2ca63298c',
          gav: 'com.sap.ui5:mobile:1.29.0-SNAPSHOT:jar'
        }
      ]
    };

    var requestStub = {};
    var SpecResolver = proxyquire("../src/remoteSAPUI5SpecResolver.js", {'urllib-sync': requestStub});
    var specResolver = new SpecResolver({});

    var aPaths = specResolver._prepareSuitePaths(oAppInfo);

    expect(aPaths.length).toBe(2);
    expect(aPaths[0].pathUrl).toEqual("http://localhost:8080/testsuite/test-resources/sap/ui/core/visual/visual.suite.js");
    expect(aPaths[1].pathUrl).toEqual("http://localhost:8080/testsuite/test-resources/sap/m/visual/visual.suite.js");
  });

  it("Should download json file to test directory, and return array. Should call mkdirSync and writeFileSync mocks.", function () {
    var oSuitesMockData = {
      type: 'buffer',
      status: 200,
      headers: {
        'access-control-allow-origin': '*',
        vary: 'Origin',
        'accept-ranges': 'bytes',
        date: 'Mon, 20 Apr 2015 13:44:53 GMT',
        'cache-control': 'public, max-age=0',
        'last-modified': 'Mon, 20 Apr 2015 10:29:52 GMT',
        etag: 'W/"af-2723698073"',
        'content-type': 'application/javascript',
        'content-length': '175',
        connection: 'keep-alive'
      },
      data: 'sap.m.ActionSelect'
    };

    var requestStub = {
      request: function (path) {
        return oSuitesMockData;
      }
    };

    var fsStub = {
      writeFileSync: function () {
        return true;
      },
      mkdirSync: function () {
        return true;
      }
    };

    spyOn(fsStub, "writeFileSync");
    spyOn(fsStub, "mkdirSync")

    var SpecResolver = proxyquire("../src/remoteSAPUI5SpecResolver.js", {
      'urllib-sync': requestStub,
      'fs': fsStub
    });

    var specResolver = new SpecResolver({});

    var oPaths = [{
      pathUrl: 'http://veui5infra.dhcp.wdf.sap.corp:8080/demokit/resources/sap-ui-version.json',
      targetFolder: 'test/target/test-download/'
    }];

    var aResultPaths = specResolver._downloadFiles(oPaths, oPaths.targetFolder);

    expect(fsStub.mkdirSync).toHaveBeenCalled();
    expect(fsStub.writeFileSync).toHaveBeenCalled();
    expect(aResultPaths[0].pathUrl).toContain("sap-ui-version.json");
  });

  it("Should load given spec and return specs array, should call mkdirSync and writeFileSync mocks.", function () {
    var aSuites = [{
      pathUrl: 'http://localhost:8080/testsuite/test-resources/sap/m/visual/visual.suite.js',
      targetFolder: 'target/specs/sap.m/'
    }];

    var oSpecMockData = {
      type: 'buffer',
      status: 200,
      headers: {
        'access-control-allow-origin': '*',
        vary: 'Origin',
        'accept-ranges': 'bytes',
        date: 'Mon, 20 Apr 2015 14:10:47 GMT',
        'cache-control': 'public, max-age=0',
        'last-modified': 'Wed, 01 Apr 2015 12:56:25 GMT',
        etag: 'W/"b12-568638981"',
        'content-type': 'application/javascript',
        'content-length': '2834',
        connection: 'keep-alive'
      },
      data: 'Spec file mock data'
    };

    var requestStub = {
      request: function (path) {
        return oSpecMockData;
      }
    };

    var fsStub = {
      writeFileSync: function () {
        return true;
      },
      mkdirSync: function () {
        return true;
      }
    };

    spyOn(fsStub, "writeFileSync");
    spyOn(fsStub, "mkdirSync");

    var SpecResolver = proxyquire("../src/remoteSAPUI5SpecResolver.js", {
      'urllib-sync': requestStub,
      'fs': fsStub
    });

    var specResolver = new SpecResolver({});

    var aSpecs = specResolver._loadSpecs(aSuites);

    expect(fsStub.mkdirSync).toHaveBeenCalled();
    expect(fsStub.writeFileSync).toHaveBeenCalled();
    expect(aSpecs.length).toBe(1);
    expect(aSpecs[0].name).toEqual("sap.m.ActionSelect");
  });

  it("Should load filtrated specs.", function () {
    var oSpecMockData = {
      type: 'buffer',
      status: 200,
      headers: {
        'access-control-allow-origin': '*',
        vary: 'Origin',
        'accept-ranges': 'bytes',
        date: 'Mon, 20 Apr 2015 14:10:47 GMT',
        'cache-control': 'public, max-age=0',
        'last-modified': 'Wed, 01 Apr 2015 12:56:25 GMT',
        etag: 'W/"b12-568638981"',
        'content-type': 'application/javascript',
        'content-length': '2834',
        connection: 'keep-alive'
      },
      data: 'Spec file mock data'
    };

    var requestStub = {
      request: function (path) {
        return oSpecMockData;
      }
    };

    var fsStub = {
      writeFileSync: function () {
        return true;
      },
      mkdirSync: function () {
        return true;
      }
    };

    var SpecResolver = proxyquire("../src/remoteSAPUI5SpecResolver.js", {
      'urllib-sync': requestStub,
      'fs': fsStub
    });

    var specResolver = new SpecResolver({specFilter : "sap.ui.core.acc", baseUrl: "http://localhost:8080"});
    var oSpecAcc = specResolver._specsFilter("ACC.spec.js", "sap.ui.core", "sap/ui/core");

    specResolver = new SpecResolver({specFilter: "sap.m", baseUrl: "http://localhost:8080"});
    var oSpecActionSelect = specResolver._specsFilter("ActionSelect.spec.js", "sap.m", "sap/m");

    specResolver = new SpecResolver({specFilter: "sap.m,ACC", baseUrl: "http://localhost:8080"});
    var oSpec = specResolver._specsFilter("ActionSelect.spec.js", "sap.m", "sap/m");

    specResolver = new SpecResolver({baseUrl: "http://localhost:8080"});
    var oSpecWithoutFilter = specResolver._specsFilter("Test", "test", "test");

    expect(oSpecActionSelect.name).toEqual("sap.m.ActionSelect");
    expect(oSpecAcc.name).toEqual("sap.ui.core.ACC");
    expect(oSpec.name).toEqual("sap.m.ActionSelect")
    expect(oSpecWithoutFilter.name).toEqual("test.Test");
  });
});
