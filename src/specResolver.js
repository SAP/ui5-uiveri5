'use strict';

var path = require('path');
var glob = require('glob');

var logger = require("./logger");

var SPEC_ROOT = '../openui5/src/sap.m/test/sap/m/visual/';
var CONTENT_URI_ROOT = 'testsuite/test-resources/';

/**
 @typedef SpecType
 @type {Object}
 @property {string} name Spec name e.g. ActionSelect
 @property {string} lib Library name e.g. sap/m/
 @property {string} path Spec file path
 @property {string} contentUri Content uri related to baseUrl
 */

/**
 Discover all applicable specs
 @param {String} libsFilter comma separated list of library names, defaults to *
 @param {String} specsFilter comma separated list of specs, defaults to *
 @return {Array.<SpecType>} Specs
*/
var discover = function(libsFilter,specsFilter){

  libsFilter = libsFilter || '*';
  specsFilter = specsFilter || '*';

  // c:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
  //http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html

  /** @type {Array.<SpecType>} */
  var specs = [];
  var specPathMask = path.normalize(process.cwd() + '/' + SPEC_ROOT + '*.spec.js');
  var specPaths = glob.sync(specPathMask);
  specPaths.forEach(function(specPath){

    // extract spec file name - glob corrected the separator on win
    //var specFileName = specPath.split('/').pop().split('.')[0];
    var specMatch =  specPath.match(/(?:\w\:)?\/(?:\w+\/)+([\w.]+)\/(?:\w+\/)+(\w+)\.spec\.js/);
    if (specMatch===null){
      throw new Error('Could not parse spec path: ' + specPath);
    }
    var specLib = specMatch[1];
    var specName = specMatch[2];

    /** @type {SpecType} */
    var spec = {
      name: specName,
      lib: specLib,
      path: specPath,
      contentUri: CONTENT_URI_ROOT + specLib.replace(/\./,'/') + '/' + specName + '.html'
    };
    specs.push(spec);

    logger.debug(
      'Spec found, name: ' + spec.name + ' ,lib: ' + spec.lib +
      ' ,path: ' + spec.path + ' ,contentUri: ' + spec.contentUri);
  });

  // return array of canonical pathnames of specs
  return specs;
};

exports.discover = discover;
