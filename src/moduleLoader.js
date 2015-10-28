
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

ModuleLoader.prototype._loadModule = function(moduleDef,args){
  if (!args){
    args = [];
  }

  if (_.isObject(moduleDef)){
    var moduleName = moduleDef.name;
    if (!moduleName){
      throw Error('Module: ' + moduleName + ' object does not have member "name"');
    }
    var instanceConfig = _.clone(moduleDef,true);
    delete instanceConfig.name;
    args.unshift(this.config,instanceConfig,this.logger);

    this.logger.debug('Loading module: ${moduleName} with instance config: ${JSON.stringify(instanceConfig)}',
      {moduleName:moduleName,instanceConfig:instanceConfig});
    return require(moduleName).apply(this,args);
  } else if (_.isString(moduleDef)) {
    args.unshift(this.config, {}, this.logger);

    this.logger.debug('Loading module: ${moduleName} with empty instance config',
      {moduleName: moduleDef});
    return require(moduleDef).apply(this, args);
  } else {
    throw Error('Module instance: ' + moduleDef + ' is not an object or string');
  }
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

ModuleLoader.prototype.loadNamedModule = function(moduleName,args){

  // serch for module and its configs
  var moduleDefName = this.config[moduleName];
  if (typeof moduleDefName == 'undefined'){
    throw Error('Module: ' + moduleName + ' is not available in config');
  }

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
  return this._loadModule(moduleDef,args);
};

module.exports = function(config,logger){
  return new ModuleLoader(config,logger);
};
