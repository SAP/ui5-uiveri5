/**
 @typedef LocalSAPUI5SpecResolverConfig
 @type {Object}
 @property {string} contentRootUri defaults to 'testsuite/test-resources/'
 */

/**
 @typedef Config
 @type {Object}
 @property {String} specs blob pattern to resolve specs,
  defaults to: localSpecResolver-> './*.spec.js'
               localSAPUI5SepcResolver -> '../openui5/src/**/test/**/visual/*.spec.js'
 @property {String} baseUrl base url to reference, defaults to
 @property {String} libFilter comma separated list of library names, defaults to *
 @property {String} specFilter comma separated list of specs, defaults to *
 */

/**
 @typedef SpecType
 @type {Object}
 @property {String} name Spec full name e.g. sap.m.ActionSelect
 @property {String} path Spec file path on local file system, will be require()'d
 @property {String} contentUrl Content URL, false to avoid opening the page
 */

/**
 Resolve all specs
 @constructor
 @param {Object.<Config>} config holds all configurations
 */
function SpecResolver(config){
  this.config  = config;
}

/**
 Resolve all applicable specs
 @return {Object.<SpecType>} all applicable specs
 */
SpecResolver.prototype.resolve = function(){
}

