/**
 * Created by i304310 on 30/3/2015
 */
'use strict';
//requires
var logger = require("./logger");
var fs = require('fs');
var request = require('urllib-sync').request;
var path = require('path');

//constants
var BASE_URL = 'http://localhost:8080';
var CONTENT_ROOT_URI = '/testsuite/test-resources/';
var LIBS_INFO_URI = '/testsuite/resources/sap-ui-version.json';
var SPECS_FOLDER = 'target/specs/';
var ENCODING_UTF8 = 'utf8';

var sBaseUrl = "";
var sContentRootUri = "";
var sLibsInfoUri = "";
var sSpecFolder = "";
var sLibsFilter = "";
var sSpecsFilter = "";

var oAppInfo;
var aPaths;
var aSpecs;
var aSpecPaths = [];

function RemoteSpecResolver(config) {
  this.config = config;
};

RemoteSpecResolver.prototype.resolve = function() {
  sBaseUrl = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.baseUrl : BASE_URL;
  sContentRootUri = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.contentUri : CONTENT_ROOT_URI;
  sLibsInfoUri = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.libsInfoUri : LIBS_INFO_URI;
  sSpecFolder = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.specsFolder : SPECS_FOLDER;
  sLibsFilter = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.libFilter : "*";
  sSpecsFilter = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.specFilter : "*";

  //get the libs info from sap-ui-version.json - parameter
  var oAppInfoRaw = request(sBaseUrl + sLibsInfoUri);
  oAppInfo = JSON.parse(oAppInfoRaw.data);

  //get suite files paths, created from the lib name 
  aPaths = this._getLibNames(oAppInfo);

  //write the suite files with given paths to given folder
  this._downloadFiles(aPaths, aPaths.targetFolder);

  //load spec files from all downloaded suite files
  aSpecs = this._loadSpecs();
  
  return aSpecs;
};
/**
 * Extracts library names from oAppInfo
 * @param {Object} oAppInfo - object with information about libraries (from sap-ui-version.json)
 * @returns {String[]} aPaths - array with paths to suite files of selected libraries
 * */
RemoteSpecResolver.prototype._getLibNames = function(oAppInfo) {
  var aLibraries = oAppInfo.libraries;
  var len = aLibraries.length;
  var aLibs = [];
  var sLibName;
  var aLibsFilter = [];
  var aSuitePaths = [];

  if(sLibsFilter != "*" && sLibsFilter.length > 1) {      
    aLibsFilter = sLibsFilter.split(", ");
  } 

  //get all lib names
  for (var i = 0; i < len; i++) {
    if (aLibsFilter.length > 0) {
      for(var j = 0; j < aLibsFilter.length; j++) {
        if(aLibsFilter[j] == aLibraries[i].name) {
          sLibName = aLibraries[i].name;
          aLibs.push(sLibName);
        }
      }
    } else {
      sLibName = aLibraries[i].name;
      aLibs.push(sLibName);
    }
  }

  //create paths to suite files
  for (var i = 0; i < aLibs.length; i++) {
    aSuitePaths.push({pathUrl: sBaseUrl + sContentRootUri + aLibs[i].replace(/\./g, "/") + "/visual/visual" + ".suite.js", targetFolder: sSpecFolder + aLibs[i] + "/"});
  }

  return aSuitePaths;
};

/**
 * Write data from given path to file
 * @param {String[]} aPaths array of paths for downloading content
 * @param {String} sTargetFolder string - name of the folder where the files will be written
 * */ 
RemoteSpecResolver.prototype._downloadFiles = function (oPaths, sTargetFolder) {
  for (var i = 0; i < oPaths.length; i++) {
    var oSuiteData = request(oPaths[i].pathUrl);
    var sStatus = parseInt(oSuiteData.status);

    var targetFolder = sTargetFolder ? sTargetFolder : oPaths[i].targetFolder;

    if(sStatus >= 200 && sStatus <= 205) {
      if(!fs.existsSync(targetFolder)) {      
        RemoteSpecResolver.prototype._mkdir(targetFolder);
      }

      RemoteSpecResolver.prototype._writeToFile(oSuiteData.data, targetFolder + oPaths[i].pathUrl.split("/").pop());
      aSpecPaths.push({pathUrl: oPaths[i].pathUrl, targetFolder: oPaths[i].targetFolder});
    } else if(sStatus == 404) {
      //throw an error when is needed
      logger.debug("Cannot find file with path: " + oPaths[i].pathUrl + ". Failed with status code: " + sStatus);
    } else {
      throw new Error('Cannot download file with path: ' + oPaths[i].pathUrl + ', status: ' + sStatus);
    }
  }
}; 

/**
 * Load all spec files from reuired suites and prepare spec object
 * @param {String[]} aPaths array of paths and names of spec files, loaded from suites
 * @return aSpec {String[]} array of spec objects
 * */
RemoteSpecResolver.prototype._loadSpecs = function(aPaths) {
  var oSuiteFiles = {
      specNames: [],
      specUris: []
  };
  var aSpecs = [];
  var sSpecOwnName;
  var sSpecPath;
  var sSpecLibFolderName = '';
  var sCurrentDir = '';
  var aSpecFilePaths = aSpecPaths.length > 0 ? aSpecPaths : aPaths;

  //fill the aSpecPaths with specNames and specUris arrays
  aSpecFilePaths.forEach(function(sPath) {
    oSuiteFiles.specNames.push(require("./../" + sPath.targetFolder + sPath.pathUrl.split("/").pop()));

    if (sPath.pathUrl.split("/")[8] == "visual") {        
      oSuiteFiles.specUris.push(sPath.pathUrl.split("/").slice(5, 8).join("/"));
    } else {
      oSuiteFiles.specUris.push(sPath.pathUrl.split("/").slice(5, 7).join("/"));
    }
  });

  //create spec objects with paths, names, urls and etc. 
  var oSpec = {};
  //Iterate the required suites
  for (var i = 0; i < oSuiteFiles.specNames.length; i++) {
    //iterate the paths in every suite

    for (var j = 0; j < oSuiteFiles.specNames[i].length; j++) {

      sCurrentDir = process.cwd() + "/";
      //get the library and file name
      var sLibUri = '';
      sLibUri = oSuiteFiles.specUris[i];

      //create specOwnName - get the sLibUri and replace \ with .
      //create specLibFolderName - concat sSpecFolder and specOwnName
      sSpecOwnName = sLibUri.replace(/\//g, ".");
      sSpecLibFolderName = path.join(sSpecFolder, sSpecOwnName);

      //create the specOwnName - get the last element of aSplitted and remove the .spec.js extension
      //create path to spec - normalized path - concated specs folder and the last element of aSplitted array (the name of the spec)
      sSpecPath = path.normalize(sCurrentDir + sSpecLibFolderName + "/" + oSuiteFiles.specNames[i][j]);

      //creating the spec object with name (example sap.m.ActionSelect), path (example target\spec\ActionSelect.spec.js), 
      //content url (example http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html) and 
      //spec uri (example http://localhost:8080/testsuite/test-resources/sap/m/visual/ActionSelect.spec.js)
      oSpec = {
          name: sSpecOwnName + "." + oSuiteFiles.specNames[i][j].split(".")[0],
          path: sSpecPath,
          contentUrl: sBaseUrl + sContentRootUri + sLibUri + "/" + oSuiteFiles.specNames[i][j].replace("visual/", "").replace("spec.js", "html"),
          specUris: sBaseUrl + sContentRootUri + sLibUri + "/visual/" + oSuiteFiles.specNames[i][j]
      };

      if(sSpecsFilter != "*") {
        var aSpecsFilter = sSpecsFilter.split(", ");

        if(aSpecsFilter.indexOf(oSuiteFiles.specNames[i][j]) != -1) {
          RemoteSpecResolver.prototype._fillSpecsArray(oSpec, sSpecLibFolderName, aSpecs);
        }        
      } else {
        RemoteSpecResolver.prototype._fillSpecsArray(oSpec, sSpecLibFolderName, aSpecs);
      }
    }
  }

  return aSpecs;
};

/**
 * Fills the aSpecs array with oSpec objects
 * @param {Object} oSpec object with information about the spec
 * @param {String} sSpecLibFolderName string of the folder name where the spec will be downloaded
 * @param {String[]} aSpecs array with info about specs
 * */
RemoteSpecResolver.prototype._fillSpecsArray =  function(oSpec, sSpecLibFolderName, aSpecs) {
  RemoteSpecResolver.prototype._downloadFiles([{pathUrl: oSpec.specUris}], sSpecLibFolderName + "/");
  logger.debug("Spec found, name: " + oSpec.name + ", path: " + oSpec.path + ", contentUrl: " + oSpec.contentUrl);
  aSpecs.push(oSpec);
}

/**
 * Writes data from file to new file in given folder
 * @param {String} sFileData data from source file
 * @param {String} sFileName name of the file
 * */
RemoteSpecResolver.prototype._writeToFile = function(sFileData, sFileName) {
  fs.writeFileSync(sFileName, sFileData, ENCODING_UTF8);
};

/**
 * Makes directory from given path and root(optional)
 * @param {String} path string of directory path
 * @param {String} root - optional string for directory root
 * */
RemoteSpecResolver.prototype._mkdir =  function(path, root) {  
  var dirs = path.split('/'), dir = dirs.shift(), root = (root||'')+dir+'/';

  try {
    fs.mkdirSync(root);
  } catch (e) {
    //dir wasn't made, something went wrong
    if(!fs.statSync(root).isDirectory()) throw new Error("Folder cannot be created: " + e);
  }

  return !dirs.length||RemoteSpecResolver.prototype._mkdir(dirs.join('/'), root);
};

module.exports = function(oConfig) {
  return new RemoteSpecResolver(oConfig);
};