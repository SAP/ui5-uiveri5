/**
 * @typedef Spec
 * @type {Object}
 * @property {string} name - Spec full name
 *  e.g. sap.m.ActionSelect
 * TODO @property {string} name - spec name
 *  e.g. ActionSelect
 * TODO @property {string} fullName - spec full name
 *  e.g. sap.m.ActionSelect
 * @property {string} path - Spec file path on local file system, will be require()'d
 *  e.g. c:\work\openui5\dist\spec\sap.m\ActionSelect.spec.js
 * TODO @property {string} testPath - Spec file path on local file system, will be require()'d
 *  e.g. c:\work\openui5\dist\spec\sap.m\ActionSelect.spec.js
 *  e.g. C:\work\git\openui5\src\sap.m\test\sap\m\visual\ActionSelect.spec.js
 * TODO @property {string} testBasePath - Spec file path on local file system, will be require()'d
 *  e.g. c:\work\openui5\dist\spec\sap.m\
 *  e.g. C:\work\git\openui5\src\sap.m\test\sap\m\visual
 * TODO @property {string} testUrl
 * TODO @property {string} testBaseUrl
 *  e.g. http://localhost:8080/testsuite/..../visual/
 * @property {string|false} contentUrl - Full content URL, false to avoid opening the page
 *  e.g. http://localhost:8080/testsuite/..../ActionSelect.html
 */

/**
 * Resolves specs
 * @constructor
 * @param {SpecResolverConfig} config - configs
 */
function SpecResolver(config){
  this.config  = config;
}

/**
 * Resolve all applicable specs
 * @return {Spec[]} all applicable specs
 */
SpecResolver.prototype.resolve = function(){
}

