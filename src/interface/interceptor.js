/**
 * @typedef InterceptorConfig
 * @type {Object}
 * @extends {Config}
 */

/**
 * @typedef ui5InstrumentationInterceptorConfig
 * @type {Object}
 * @extends {InterceptorConfig}
 * @property {string} instCode - the instrumentation code as string to inject in the page
 */

/**
 * @typedef authInterceptorConfig
 * @type {Object}
 * @extends {InterceptorConfig}
 * @property {string(basic|...)} auth.type - authentication type, one of: basic
 * @property {string} auth.user - user
 * @property {string} auth.pass - password
 */

/**
 * @typedef httpsInterceptorConfig
 * @type {Object}
 * @extends {InterceptorConfig}
 */

/**
 * @typedef httpInterceptorConfig
 * @type {Object}
 * @extends {InterceptorConfig}
 */

/**
 * Intercept connection opening
 * @constructor
 * @param {InterceptorConfig} config - configs
 * @param {Interceptor} interceptor - chained interceptor to use
 */
function Interceptor(config,interceptor){
  this.config  = config;
  this.interceptor = interceptor;
}

/**
 * Request a resource over this interceptor
 * @param {string} url - url to open
 * @return {http.ClientRequest}
 */
Interceptor.prototype.request = function(){
};
