/**
 * @typedef SpecResolverConfig
 * @type {Object}
 * @property {String} specs - blob pattern to resolve specs, defaults depending of specific specResolver
 * @property {String} baseUrl - base url to reference, defaults to: 'http://localhost:8080'
 * @property {String} libFilter  - comma separated list of library names, defaults to *
 * @property {String} specFilter - comma separated list of specs, defaults to *
 */

/**
 * @typedef Spec
 * @type {Object}
 * @property {String} name - Spec full name e.g. sap.m.ActionSelect
 * @property {String} path - Spec file path on local file system, will be require()'d
 * @property {String|false} contentUrl - Full content URL, false to avoid opening the page
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

