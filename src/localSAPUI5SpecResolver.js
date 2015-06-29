'use strict';

var path = require('path');
var glob = require('glob');
var logger = require("./logger");

var SPECS_GLOB = '../openui5/src/**/test/**/visual/*.spec.js';
var CONTENT_ROOT_URI = 'testsuite/test-resources/';

/**
 * @typedef LocalSAPUI5SpecResolverConfig
 * @type {Object}
 * @extends {SpecResolverConfig}
 * @property {String} specs - blob pattern to resolve specs, defaults to: '../openui5/src/**/test/**/visual/*.spec.js'
 * @property {String} LocalSAPUI5SpecResolverConfig.contentRootUri - content uri, defaults to: 'testsuite/test-resources/'
 */

/**
 * Resolves specs
 * @constructor
 * @param {LocalSAPUI5SpecResolverConfig} config - configs
 */
function SpecResolver(config){
  this.config  = config;
}

SpecResolver.prototype.resolve = function(){
  var that = this;

  // defaults
  var libsFilter = this.config.libFilter || '*';
  var specsFilter = this.config.specFilter || '*';
  var specGlob = this.config.specs || SPECS_GLOB;
  var contentRootUri = (this.config.localSAPUI5SpecResolver ? this.config.localSAPUI5SpecResolver.contentRootUri : false) || CONTENT_ROOT_URI;

  // c:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
  //http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html

  /** @type {Spec[]} */
  var specs = [];

  //log
  logger.debug('Resolving specs from: ' + specGlob + " contentRootUri: " + contentRootUri);

  // resolve glob to array of paths
  var specPathMask = path.normalize(process.cwd() + '/' + specGlob);
  var specPaths = glob.sync(specPathMask);
  specPaths.forEach(function(specPath){

    // extract spec file name - glob corrected the separator on win
    //var specFileName = specPath.split('/').pop().split('.')[0];
    var specMatch =  specPath.match(/(?:\w\:)?\/(?:\w+\/)+([\w.]+)\/(?:\w+\/)+(\w+)\.spec\.js/);
    if (specMatch===null){
      throw new Error('Could not parse spec path: ' + specPath);
    }
    var specLib = specMatch[1];
    var specOwnName = specMatch[2];

    /** @type {Spec} */
    var spec = {
      name: specLib + '.' + specOwnName,
      _ownName: specOwnName,
      _lib: specLib,
      path: specPath,
      contentUrl: contentRootUri !== '' ?
        that.config.baseUrl + '/' + contentRootUri + specLib.replace(/\./,'/') + '/' + specOwnName + '.html' : false
    };

    // TODO filter specs according libFilter and specFilter

    specs.push(spec);
    logger.debug('Spec found, name: ' + spec.name + ' ,path: ' + spec.path + ' ,contentUrl: ' + spec.contentUrl);
  });

  // return the specs
  return specs;
};

module.exports = function(config){
  return new SpecResolver(config);
};
