/**
 * Created by i304310 on 30/3/2015
 */
'use strict';
//requires
var logger = require("./logger");
var fs = require('fs');
var request = require('urllib-sync');
var path = require('path');

//constants
var BASE_URL = 'http://localhost:8080';
var CONTENT_ROOT_URI = '/testsuite/test-resources/';
var LIBS_INFO_URI = '/testsuite/resources/sap-ui-version.json';
var SPECS_FOLDER = 'target/specs/';
var ENCODING_UTF8 = 'utf8';

function RemoteSpecResolver(config) {
  this.config = config;
  this.sBaseUrl = this.config.baseUrl || BASE_URL;
  this.sContentRootUri = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.contentUri : CONTENT_ROOT_URI;
  this.sLibsInfoUri = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.libsInfoUri : LIBS_INFO_URI;
  this.sSpecFolder = this.config.remoteSAPUI5SpecResolver ? this.config.remoteSAPUI5SpecResolver.specsFolder : SPECS_FOLDER;
  this.sLibFilter = this.config.libFilter  || "*";
  this.sSpecFilter = this.config.specFilter  || "*";
};

RemoteSpecResolver.prototype.resolve = function () {

  //get the libs info from sap-ui-version.json - parameter
  var oAppInfoRaw = request.request(this.sBaseUrl + this.sLibsInfoUri);
  var oAppInfo = JSON.parse(oAppInfoRaw.data);

  //get suite files paths, created from the lib name
  var aSuitePaths = this._prepareSuitePaths(oAppInfo);

  //write the suite files with given paths to given folder
  logger.info('Download suite files');
  var aSpecPaths = this._downloadFiles(aSuitePaths,undefined,true);

  //load spec files from all downloaded suite files
  logger.info('Download spec files');
  var aSpecs = this._loadSpecs(aSpecPaths);

  return aSpecs;
};

/**
 * Extracts library names from oAppInfo
 * @param {Object} oAppInfo - object with information about libraries (from sap-ui-version.json)
 * @returns {{pathUrl: String, targetFolder: String}} aSuitePaths - array with paths to suite files of selected libraries,
 * pathUrl - url to suite files, targetFolder - where to store the files
 * */
RemoteSpecResolver.prototype._prepareSuitePaths = function (oAppInfo) {
  var aLibraries = oAppInfo.libraries;
  var len = aLibraries.length;
  var aLibs = [];
  var sLibName;
  var aLibsFilter = [];
  var aSuitePaths = [];

  //resolve lib filter
  if (this.sLibFilter != "*" && this.sLibFilter.length > 1) {
    aLibsFilter = this.sLibFilter.split(", ");
  }

  //get all lib names
  for (var i = 0; i < len; i++) {
    if (aLibsFilter.length > 0) {
      for (var j = 0; j < aLibsFilter.length; j++) {
        if (aLibsFilter[j] == aLibraries[i].name) {
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
    aSuitePaths.push({
      pathUrl: this.sBaseUrl + this.sContentRootUri + aLibs[i].replace(/\./g, "/") + "/visual/visual" + ".suite.js",
      targetFolder: this.sSpecFolder + aLibs[i] + "/"
    });
  }

  return aSuitePaths;
};

/**
 * Write data from given path to file
 * @param {{pathUrl: String, targetFolder: String}} aPaths - array of paths for downloading content,
 * pathUrl - url to suite files, targetFolder - where to store the files
 * @param {String} [sTargetFolder] - name of the folder where the files will be written
 * @param {boolean} [bIgnore404=false] - ignore 404s
 * @return {{pathUrl: String, targetFolder: String}[]} - array with objects - urls and target folder
 * pathUrl - url to suite files, targetFolder - where to store the files
 * */
RemoteSpecResolver.prototype._downloadFiles = function (aPaths, sTargetFolder, bIgnore404) {
  var aResultPaths = [];
  for (var i = 0; i < aPaths.length; i++) {
    var oResponse = request.request(aPaths[i].pathUrl);

    var targetFolder = sTargetFolder ? sTargetFolder : aPaths[i].targetFolder;
    if (oResponse.status >= 200 && oResponse.status <= 205) {
      if (!fs.existsSync(aPaths[i].targetFolder)) {
        this._mkdirs(targetFolder);
      }
      fs.writeFileSync(targetFolder + aPaths[i].pathUrl.split("/").pop(), oResponse.data, ENCODING_UTF8);
      aResultPaths.push({pathUrl: aPaths[i].pathUrl, targetFolder: aPaths[i].targetFolder});
      logger.debug('Downloaded: ' + aPaths[i].pathUrl);
    } else if (oResponse.status == 404 && bIgnore404) {
      logger.debug('Cannot find: ' + aPaths[i].pathUrl);
    } else {
      throw new Error('Cannot download: ' + aPaths[i].pathUrl +
        ', status: ' + oResponse.status + ', message: ' + oResponse.data);
    }
  }

  return aResultPaths;
};

/**
 * Load all spec files from reuired suites and prepare spec object
 * @param {{pathUrl: String, targetFolder: String}[]} aSpecPaths array of objects -  paths and names of spec files, loaded from suites,
 * pathUrl - url to suite files, targetFolder - where to store the files
 * @return {{name: String, path: String, contentUrl: String, _specUrls: String}[]} array of spec objects,
 * name is the spec name, path: is the absolute path to the spec file, contentUrl is the url to content page (html),
 * _specUrls is the url to the spec file on the server
 * */
RemoteSpecResolver.prototype._loadSpecs = function (aSpecPaths) {
  var oSuiteFiles = {
    specNames: [],
    specUris: []
  };
  var aSpecs = [];
  var sLibName;

  //fill the aSpecPaths with specNames and specUris arrays
  aSpecPaths.forEach(function (sPath) {
    var requiredSuite = require("./../" + sPath.targetFolder + sPath.pathUrl.split("/").pop());
    //check the requiredSuite type
    if (requiredSuite instanceof Array) {
      oSuiteFiles.specNames.push(requiredSuite);
    } else if (requiredSuite instanceof Function) {
      requiredSuite({specs: oSuiteFiles.specNames});
    }

    //get the library name from the path
    var sPathMatch = sPath.pathUrl.match(/(sap)(.*)(?=\/visual\/)/);

    if (sPathMatch) {
      oSuiteFiles.specUris.push(sPathMatch[0]);
    }
  });

  //Iterate the required suites
  for (var i = 0; i < oSuiteFiles.specNames.length; i++) {
    //iterate the paths in every suite
    for (var j = 0; j < oSuiteFiles.specNames[i].length; j++) {
      //get the library and file name
      var sLibUri = '';

      sLibUri = oSuiteFiles.specUris[i];

      // apply specFilter
      var oSpec = this._applySpecFilter(oSuiteFiles.specNames[i][j], sLibUri);
      if(oSpec) {
        aSpecs.push(oSpec);
      }
    }
  }

  return aSpecs;
};


/**
 * Apply spec filters
 * @param {String} specName - name of the spec file
 * @param {String} sLibUri - lib URI fragment
 * @return {({name: String, path: String, contentUrl: String, _specUrls: String}|undefined)} object with information about spec file
 * */
RemoteSpecResolver.prototype._applySpecFilter = function (specName, sLibUri) {
  var oSpec;

  //create specOwnName - get the sLibUri and replace \ with .
  var sLibName = sLibUri.replace(/\//g, ".");

  if (this.sSpecFilter && this.sSpecFilter != "*") {
    var that = this;
    var aSpecsFilter = this.sSpecFilter.split(",");
    aSpecsFilter.forEach(function(filter) {
      if((sLibName + "." + specName).toLowerCase().indexOf(filter.toLowerCase()) != -1) {
        oSpec = that._fillSpecsArray(sLibUri, specName, sLibName);
      }
    });
  } else {
    oSpec = this._fillSpecsArray(sLibUri, specName, sLibName);
  }

  return oSpec;
};

/**
 * Fills the aSpecs array with oSpec objects
 * @param {String} sLibUri - String of library URI
 * @param (String} specName - name of the current spec
 * @param {String} sLibName - name of the spec's library
 * @return {{name: String, path: String, contentUrl: String, _specUrls: String}[]} array of spec objects,
 * name is the spec name, path: is the absolute path to the spec file, contentUrl is the url to content page (html),
 * _specUrls is the url to the spec file on the server
 * */
RemoteSpecResolver.prototype._fillSpecsArray = function (sLibUri, specName, sLibName) {
  var sSpecPath;
  var sSpecLibFolderName = path.resolve(this.sSpecFolder, sLibName);
  var aSpecs = [];

  //create path to spec - normalized path - concated specs folder and the last element of aSplitted array (the name of the spec)
  sSpecPath = path.resolve(this.sSpecFolder, sLibName, specName);

  var oSpec = {
    name: sLibName + "." + specName.split(".")[0],
    path: sSpecPath,
    contentUrl: this.sBaseUrl + this.sContentRootUri + sLibUri + "/" + specName.replace("visual/", "").replace("spec.js", "html"),
    _specUrls: this.sBaseUrl + this.sContentRootUri + sLibUri + "/visual/" + specName
  };

  this._downloadFiles([{pathUrl: oSpec._specUrls}], sSpecLibFolderName + "/");
  logger.debug("Spec found, name: " + oSpec.name + ", path: " + oSpec.path + ", contentUrl: " + oSpec.contentUrl);
  aSpecs.push(oSpec);

  return oSpec;
}

/**
 * Makes directory from given path and root
 * @param {String} path - string of directory path
 * @param {String} [root] - optional string for directory root
 * */
RemoteSpecResolver.prototype._mkdirs = function (path, root) {
  var dirs = path.split('/'), dir = dirs.shift(), root = (root || '') + dir + '/';

  try {
    fs.mkdirSync(root);
  } catch (e) {
    //dir wasn't made, something went wrong
    if (!fs.statSync(root).isDirectory()) throw new Error("Folder cannot be created: " + e);
  }

  return !dirs.length || this._mkdirs(dirs.join('/'), root);
};

module.exports = function (oConfig) {
  return new RemoteSpecResolver(oConfig);
};
