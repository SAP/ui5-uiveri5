
var _ = require('lodash');

/**
 * Module loader
 * @param {Config} config
 * @param {Logger} logger
 * @constructor
 */
function ModuleLoader(config,logger) {
  this.config = config;
  this.logger = logger;
}

ModuleLoader.prototype._loadModuleArray = function(moduleDef,args){
  if (_.isArray(moduleDef)){
    return moduleDef.map(function(currentModuleDef){
      return this._loadModule(currentModuleDef,args);
    },this);
  } else {
    return this._loadModule(moduleDef,args);
  }
};

ModuleLoader.prototype._loadModule = function(moduleDef,args,instanceConfig){
  if (!args){
    args = [];
  }

  if (!instanceConfig){
    instanceConfig = {};
  }

  // prepare module name and instance config
  var moduleName;
  if (_.isObject(moduleDef)){
    moduleName = moduleDef.name;
    if (!moduleName){
      throw Error('Module: ' + JSON.stringify(moduleDef) + ' object does not have member "name"');
    }
    var clonedModuleDef = _.clone(moduleDef);
    delete clonedModuleDef.name;
    instanceConfig = _.merge(clonedModuleDef,instanceConfig);
  } else if (_.isString(moduleDef)) {
    moduleName = moduleDef;
  } else {
    throw Error('Module instance: ' + moduleDef + ' is not an object or string');
  }

  // prepend default args
  var argsClone = [this.config,instanceConfig,this.logger].concat(args);

  this.logger.debug('Loading module: ${moduleName} with instance config: ${JSON.stringify(instanceConfig)}',
    {moduleName:moduleName,instanceConfig:instanceConfig});
  return require(moduleName).apply(this,argsClone);
};

/**
 * Loads specified module(s)
 * @param {string} moduleName - module name
 * @param {[Object]} args - module arguments
 * @return {(Object|[Object])} - module instance
 * @throw {Error} if module is not available in config
 */
ModuleLoader.prototype.loadModule = function(moduleName,args){
  var moduleDef = this.config[moduleName];
  if (typeof moduleDef == 'undefined'){
    throw Error('Module: ' + moduleName + ' is not available in config');
  }

  return this._loadModuleArray(moduleDef,args);
};

/**
 * Loads specified module(s)
 * @param {string} moduleName - module name
 * @param {[Object]} args - module arguments
 * @return {(Object|[Object]|undefined)} - module instance or undefined if module is not available in config
 */
ModuleLoader.prototype.loadModuleIfAvailable = function(moduleName,args) {
  var moduleDef = this.config[moduleName];
  if (typeof moduleDef == 'undefined'){
    return;
  }

  return this._loadModuleArray(moduleDef,args);
};

/**
 * Load explicitly named module instance
 * @param {string|Object} moduleName - used as key in config to find module instance name
 * @param {*[]} args
 * @param {string} [modulePath]
 */
ModuleLoader.prototype.loadNamedModule = function(moduleName,args){
  /*
   moduleName = 'auth'
   OR
   moduleName = {
     auth: {
       'fiori-form': {
         user: 'user',
         pass: 'pass'
       }
     }
   }

   moduleInstName = 'fiori-form';
   OR
   moduleInstName = {
     'fiori-form': {
       user: 'user',
       pass: 'pass'
     }
   }

   cfg.authConfig = {
     'fiori-form': {
       name: './authenticator/formAuthenticator',
       userFieldSelector: '#USERNAME_FIELD input',
       passFieldSelector: '#PASSWORD_FIELD input',
       logonButtonSelector: '#LOGIN_LINK'
     }
   }
   */

  // resolve module name and module instance object
  var moduleInstName;
  if (_.isObject(moduleName)) {
    var moduleNameKeys = Object.keys(moduleName);
    if (moduleNameKeys.length>1){
      throw new Error('More than one module name found in: ' + JSON.stringify(moduleName));
    }
    moduleInstName = moduleName[moduleNameKeys[0]];
    moduleName = moduleNameKeys[0];
  } else if (_.isString(moduleName)){
    moduleInstName = this.config[moduleName];
    if (typeof moduleName == 'undefined') {
      throw Error('Module: ' + moduleName + ' is not available in config');
    }
  } else {
    throw Error('Module name: ' + moduleName + ' is not an object or string');
  }

  // moduleName = 'auth'

  // resolve module instance config and module instance name
  var instanceConfig = {};
  if (_.isObject(moduleInstName)) {
    var moduleInstNameKeys = Object.keys(moduleInstName);
    if (moduleInstNameKeys.length>1){
      throw new Error('More than one module instance definition found for: ' + moduleName);
    }
    instanceConfig = moduleInstName[moduleInstNameKeys[0]];
    moduleInstName = moduleInstNameKeys[0];
  }

  // moduleInstName = 'fiori-form'

  // resolve module type definition
  var moduleDefs = this.config[moduleName + 'Configs'];
  if (typeof moduleDefs == 'undefined'){
    throw Error('Module: ' + moduleName + ' configs are not available in config');
  }

  // resolve required module definition
  var moduleDef = moduleDefs[moduleInstName];
  if (typeof moduleDef == 'undefined'){
    throw Error('Module: ' + moduleName + ' does not have instance : ' +  moduleInstName);
  }

  // load the specific definition
  return this._loadModule(moduleDef,args,instanceConfig);
};

module.exports = function(config,logger){
  return new ModuleLoader(config,logger);
};
