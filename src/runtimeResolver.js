


function RuntimeResolver(){
  this.defaultResolutionPerPlatformName = {
    windows: '',
    mac: '',
    //linux: '',
    android: '320x480',
    ios: '1536х1854',
    winphone: '1080x1920'
  };
  this.defaultBrowserPerPlatformName = {
    windows: 'chrome',
    mac: 'safari',
    linux: 'chrome',
    android: 'browser',
    ios: 'safari',
    winphone: 'edge'
  };
};

/**
 * Resolves browser request string to runtime object
 * @param {string} requestedRuntimeArgs - requested runtime from arguments
 * @param  {Runtime} requestedRuntimeConfig - requested runtime from config
 * @return {Runtime} - resolver runtime
 */
RuntimeResolver.prototype.resolveRuntime = function(requestedRuntimeArgs,requestedRuntimeConfig){

  // if requestedRuntime typeof string => split at , and put as browserName in browser[]

  // merge with requsetdRuntime from config

  // resolve missing fields with defaults and PerXxxx defaults
};

/**
 * Resolve selenium browser capabilities from runtime
 * @param {Runtime} runtime - requsted runtime
 * @return {Capabilities} selenium capabilities object
 */
RuntimeResolver.prototype.resolveCababilitiesFromRuntime = function(runtime){

};

/**
 * Resolve runtime from connected browser capabilities
 * @param capabilities
 * @return {Runtime} updated runtime with values from capabilities
 */
RuntimeResolver.prototype.resolveRuntimeFromCapabilities = function(capabilities,runtime){

};
