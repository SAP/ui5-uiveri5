describe("RemoteSAPUI5SpecResolver", function() {

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

  var specResolver;
  var fs;

  beforeEach(function() {
    var config = {
        profile: 'visual',
        specResolver: './remoteSAPUI5SpecResolver',
        baseUrl: 'http://localhost:8080',
        specs: '../openui5/src/**/test/**/visual/*.spec.js'
    };

    specResolver = require("../src/remoteSAPUI5SpecResolver.js")(config);
    fs = require('fs');
  });
  //do we need this?
  it("Should create new directory and return true if is done.", function() {
    var mkDirFinished = false;
    var targetFolder = "test/target/test-download/";

    mkDirFinished = specResolver._mkdir(targetFolder);
   
    var deleteFolderRecursive = function(path) {
      if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }
    };
    
    expect(mkDirFinished).toBe(true);
    if(fs.existsSync(targetFolder)) {
      deleteFolderRecursive(targetFolder);
    }
  });

  it("Should download json file to test directory, if is success it will return true.", function() {
    var oPaths = [{ pathUrl: 'http://veui5infra.dhcp.wdf.sap.corp:8080/demokit/resources/sap-ui-version.json',
      targetFolder: 'test/target/test-download/' }];
    
    specResolver._downloadFiles(oPaths, oPaths.targetFolder);
    var fileIsDownloaded = fs.existsSync("test/target/test-download/sap-ui-version.json");

    expect(fileIsDownloaded).toBe(true);
  });

  it("Paths should contain sap.ui.core and sap.m libraries and the lenght should be greater than zero.", function() {
    var aPaths = specResolver._getLibNames(oAppInfo);

    expect(aPaths.length).toBeGreaterThan(0);
    expect(aPaths[0].pathUrl).toEqual("http://localhost:8080/testsuite/test-resources/sap/ui/core/visual/visual.suite.js");
    expect(aPaths[1].pathUrl).toEqual("http://localhost:8080/testsuite/test-resources/sap/m/visual/visual.suite.js");
  });

  it("Should load given spec and return specs array. Check array's lenght and if the spec name is the same as given.", function() {
    var aSuites = [{ 
      pathUrl: 'http://localhost:8080/testsuite/test-resources/sap/m/visual/visual.suite.js',
      targetFolder: 'target/specs/sap.m/' 
    }];

    var aSpecs = specResolver._loadSpecs(aSuites);

    expect(aSpecs.length).toBeGreaterThan(0);
    expect(aSpecs[0].name).toEqual("sap.m.ActionSelect");
  });
  
  it("Should resolve specs with given config object. Check if contains 'sap'.", function() {
    var aSpecs = specResolver.resolve();
    
    expect(aSpecs.length).toBeGreaterThan(0);
    expect(aSpecs[0].name.indexOf("sap") != -1).toBe(true);
  });
});