/* eslint no-unused-vars: */
/**
 * @typedef Spec
 * @type {Object}
 * @property {string} name - spec name
 *  e.g. ActionSelect
 * @property {string} fullName - spec full name
 *  e.g. sap.m.ActionSelect
 * @property {string} lib - lib name
 *  e.g. sap.m
 * @property {string} branch - branch name
 *  e.g. master
 * @property {string} testPath - Spec file path on local file system, will be require()'d
 *  remoteUI5SpecResolver: c:/work/git/openui5/dist/spec/sap.m/ActionSelect.spec.js
 *  localUI5SpecResolver: C:/work/git/openui5/src/sap.m/test/sap/m/visual/ActionSelect.spec.js
 * @property {string|false} contentUrl - Full content URL, false to avoid opening the page
 *  http://localhost:8080/testsuite/test-resources/sap/m/ActionSelect.html
 *
 *  Note: All paths are normalized to unix-style '/'
 */

/**
 * Resolves specs
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function SpecResolver(config,instanceConfig,logger){
}

/**
 * Resolve all applicable specs
 * @return {q.promise<{Spec[]},{Error}>}  - all applicable specs
 */
SpecResolver.prototype.resolve = function(){
};

