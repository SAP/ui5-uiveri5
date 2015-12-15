
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
    delete moduleDef.name;
    instanceConfig = _.merge(instanceConfig,moduleDef);
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
 * @param {string} moduleName - used as key in config to find module instance name
 * @param {*[]} args
 * @param {string} [modulePath]
 */
ModuleLoader.prototype.loadNamedModule = function(moduleName,args){

  // search for module and its configs
  var moduleDefName = this.config[moduleName];
  if (typeof moduleDefName == 'undefined'){
    throw Error('Module: ' + moduleName + ' is not available in config');
  }

  // extract module name and args from module object instance
  var instanceConfig = {};
  if (_.isObject(moduleDefName)) {
    var moduleDefNames = Object.keys(moduleDefName);
    if (moduleDefNames.length>1){
      throw new Error('More than one module instance definition found under: ' + moduleName);
    }
    instanceConfig = moduleDefName[moduleDefNames[0]];
    moduleDefName = moduleDefNames[0];
  }

  // resolve module type definition
  var moduleDefs = this.config[moduleName + 'Configs'];
  if (typeof moduleDefs == 'undefined'){
    throw Error('Module: ' + moduleName + ' configs are not available in config');
  }

  // resolve required module definition
  var moduleDef = moduleDefs[moduleDefName];
  if (typeof moduleDef == 'undefined'){
    throw Error('Module: ' + moduleName + ' does not have instance : ' +  moduleDefName);
  }

  // load the specific definition
  return this._loadModule(moduleDef,args,instanceConfig);
};

module.exports = function(config,logger){
  return new ModuleLoader(config,logger);
};
