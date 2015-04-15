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

var oAppInfo;
var oPaths;
var aSpecs;
var aSpecPaths = [];

function RemoteSpecResolver(config) {
  this.config = config;
};

RemoteSpecResolver.prototype.resolve = function() {
  sBaseUrl = (this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.baseUrl : false) || BASE_URL;
  sContentRootUri = (this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.contentUri : false) || CONTENT_ROOT_URI;
  sLibsInfoUri = (this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.libsInfoUri : false) || LIBS_INFO_URI;
  sSpecFolder = (this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.specsFolder : false) || SPECS_FOLDER;
  sLibsFilter = (this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.suitesFolder : false) || "*";

  //get the libs info from sap-ui-version.json - parameter
  var oAppInfoRequest = request(sBaseUrl + sLibsInfoUri);
  oAppInfo = JSON.parse(oAppInfoRequest.data);

  //get suite files paths, created from the lib name 
  oPaths = this._getLibNames(oAppInfo);

  //write the suite files with given paths to given folder
  this._downloadFiles(oPaths, oPaths.targetFolder);

  //load spec files from all downloaded suite files
  aSpecs = this._loadSpecs();

  return aSpecs;
};
/**
 * Extracts library names from oAppInfo
 * @param {Object} oAppInfo - object with information about libraries (from sap-ui-version.json)
 * @returns {Array} aPaths - array with paths to suite files of selected libraries
 * */
RemoteSpecResolver.prototype._getLibNames = function(oAppInfo) {
  var aLibraries = oAppInfo.libraries;
  var len = aLibraries.length;
  var aLibs = [];
  var sLibName;
  var aLibsFilter = [];
  var oPaths = [];

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
    oPaths.push({pathUrl: sBaseUrl + sContentRootUri + aLibs[i].replace(/\./g, "/") + "/visual/visual" + ".suite.js", targetFolder: sSpecFolder + aLibs[i] + "/"});
  }

  return oPaths;
};

/**
 * Write data from given path to file
 * @param {Array} aPaths array of paths for downloading content
 * @param {String} sTargetFolder string - name of the folder where the files will be written
 * */ 
RemoteSpecResolver.prototype._downloadFiles = function (oPaths, sTargetFolder) {
  for (var i = 0; i < oPaths.length; i++) {
    var oSuiteData = request(oPaths[i].pathUrl);
    var status = parseInt(oSuiteData.status);

    var targetFolder = sTargetFolder ? sTargetFolder : oPaths[i].targetFolder;

    if(status >= 200 && status <= 205) {
      if(!fs.existsSync(targetFolder)) {      
        RemoteSpecResolver.prototype._mkdir(targetFolder);
      }

      RemoteSpecResolver.prototype._writeToFile(oSuiteData.data, targetFolder + oPaths[i].pathUrl.split("/").pop());
      aSpecPaths.push({pathUrl: oPaths[i].pathUrl, targetFolder: oPaths[i].targetFolder});
    } else if(status == 404) {
      //throw an error when is needed
      logger.debug("Cannot find file with path: " + oPaths[i].pathUrl + ". Failed with status code: " + status);
    } else {
      throw new Error('Cannot download file with path: ' + oPaths[i].pathUrl + ', status: ' + status);
    }
  }
}; 

/**
 * Load all spec files from reuired suites and prepare spec object
 * @return aSpec {Array} array of spec objects
 * */
RemoteSpecResolver.prototype._loadSpecs = function(aPaths) {
  var aSuiteFiles = {
      specName: [],
      specUri: []
  };
  var aSpecs = [];
  var specOwnName;
  var specPath;
  var specLibFolderName = '';
  var currentDir = '';
  var aSpecFilePaths = aSpecPaths.length > 0 ? aSpecPaths : aPaths;

  //fill the aSpecPaths with specName and specUri arrays
  aSpecFilePaths.forEach(function(sPath) {
    aSuiteFiles.specName.push(require("./../" + sPath.targetFolder + sPath.pathUrl.split("/").pop()));

    if (sPath.pathUrl.split("/")[8] == "visual") {        
      aSuiteFiles.specUri.push(sPath.pathUrl.split("/").slice(5, 8).join("/"));
    } else {
      aSuiteFiles.specUri.push(sPath.pathUrl.split("/").slice(5, 7).join("/"));
    }
  });

  //create spec objects with paths, names, urls and etc. 
  var oSpec = {};
  //Iterate the required suites
  for (var i = 0; i < aSuiteFiles.specName.length; i++) {
    //iterate the paths in every suite
    for (var j = 0; j < aSuiteFiles.specName[i].length; j++) {
      currentDir = process.cwd() + "/";
      //get the library and file name
      var sLibUri = '';
      sLibUri = aSuiteFiles.specUri[i];

      //create specOwnName - get the sLibUri and replace \ with .
      //create specLibFolderName - concat sSpecFolder and specOwnName
      specOwnName = sLibUri.replace(/\//g, ".");
      specLibFolderName = path.join(sSpecFolder, specOwnName);

      //create the specOwnName - get the last element of aSplitted and remove the .spec.js extension
      //create path to spec - normalized path - concated specs folder and the last element of aSplitted array (the name of the spec)
      specPath = path.normalize(currentDir + specLibFolderName + "/" + aSuiteFiles.specName[i][j]);

      //creating the spec object with name (example sap.m.ActionSelect), path (example target\spec\ActionSelect.spec.js), 
      //content url (example http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html) and 
      //spec uri (example http://localhost:8080/testsuite/test-resources/sap/m/visual/ActionSelect.spec.js)
      oSpec = {
          name: specOwnName + "." + aSuiteFiles.specName[i][j].split(".")[0],//specLibName.split("/").pop() + '.' + specOwnName,
          path: specPath,
          contentUrl: sBaseUrl + sContentRootUri + sLibUri + "/" + aSuiteFiles.specName[i][j].replace("visual/", "").replace("spec.js", "html"),
          specUri: sBaseUrl + sContentRootUri + sLibUri + "/visual/" + aSuiteFiles.specName[i][j]
      };

      RemoteSpecResolver.prototype._downloadFiles([{pathUrl: oSpec.specUri}], specLibFolderName + "/");
      logger.debug("Spec found, name: " + oSpec.name + ", path: " + oSpec.path + ", contentUrl: " + oSpec.contentUrl);
      aSpecs.push(oSpec);
    }
  }

  return aSpecs;
};

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