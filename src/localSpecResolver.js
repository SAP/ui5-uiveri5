'use strict';

var path = require('path');
var glob = require('glob');
var logger = require("./logger");

var SPECS_GLOB = './*.spec.js';

function SpecResolver(config){
  this.config  = config;
}

SpecResolver.prototype.resolve = function(){
  var that = this;

  // defaults
  var libsFilter = this.config.libFilter || '*';
  var specsFilter = this.config.specFilter || '*';
  var specGlob = this.config.specs || SPECS_GLOB;

  /** @type {Array.<SpecType>} */
  var specs = [];

  logger.debug('Resolving specs from: ' + specGlob);

  // resolve glob to array of paths
  var specPathMask = path.normalize(process.cwd() + '/' + specGlob);
  var specPaths = glob.sync(specPathMask);
  specPaths.forEach(function(specPath){

    var specOwnName = path.basename(specPath,path.extname(specPath));

    /** @type {SpecType} */
    var spec = {
      name: specOwnName,
      path: specPath,
      contentUrl: false
    };

    // TODO filter specs according specFilter

    specs.push(spec);
    logger.debug('Spec found, name: ' + spec.name + ' ,path: ' + spec.path);
  });

  // return the specs
  return specs;
};

module.exports = function(config){
  return new SpecResolver(config);
};
