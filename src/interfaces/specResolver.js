/**
 * @typedef Spec
 * @type {Object}
 * @property {string} name - spec name
 *  e.g. ActionSelect
 * @property {string} fullName - spec full name
 *  e.g. sap.m.ActionSelect
 * @property {string} testPath - Spec file path on local file system, will be require()'d
 *  remoteUI5SpecResolver: c:\work\git\openui5\dist\spec\sap.m\ActionSelect.spec.js
 *  localUI5SpecResolver: C:\work\git\openui5\src\sap.m\test\sap\m\visual\ActionSelect.spec.js
 * @property {string} testBasePath
 *  remoteUI5SpecResolver: c:\work\git\openui5\dist\spec\sap.m
 *  localUI5SpecResolver: C:\work\git\openui5\src\sap.m\test\sap\m\visual
 * TODO @property {string} testBaseUrl
 *  remoteUI5SpecResolver: http://localhost:8080/testsuite/..../sap.m/visual
 * TODO @property {string} testUrl
 *  remoteUI5SpecResolver: http://localhost:8080/testsuite/..../sap.m/visual/ActionSelect.spec.js
 * @property {string|false} contentUrl - Full content URL, false to avoid opening the page
 *  e.g. http://localhost:8080/testsuite/..../ActionSelect.html
 */

/**
 * Resolves specs
 * @constructor
 * @param {LocalSpecResolverConfig} config
 * @param {LocalSpecResolverInstanceConfig} instanceConfig
 * @param {Logger} logger
 */
function SpecResolver(config,instanceConfig,logger){
}

/**
 * Resolve all applicable specs
 * @return {Spec[]} all applicable specs
 */
SpecResolver.prototype.resolve = function(){
};

