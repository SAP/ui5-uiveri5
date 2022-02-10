var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var CONFIG_DIR = '../conf/';
var DEFAULT_CONF = path.join(CONFIG_DIR, 'default.conf.js');
var COMMON_CONF = path.join(CONFIG_DIR, 'profile.conf.js');

function ConfigParser(logger) {
  this.logger = logger;
  this.config = {};
}

ConfigParser.prototype.mergeConfigs = function (cliConfig) {
  this.config = cliConfig;

  // load config file
  // Merge paramFile with params from cliConfig
  this._mergeParams();

  this._mergeConfigFile();

  // resolve profiles
  this._resolveProfile(this.config.profile).forEach(this._mergeConfig.bind(this));

  // apply common profile
  this._mergeConfigFile(COMMON_CONF, 'common profile');

  // Changing config via confKeys
  this._setConfKeys();

  // return new fully merged config
  return this.config;
};

ConfigParser.prototype._mergeConfigFile = function (path, type) {
  if (path && type) {
    this._mergeConfig(this._readConfig(path, type));
  } else {
    this._mergeConfig(this.conf);
  }
};

ConfigParser.prototype._mergeConfig = function (newConfig) {
  var logger = this.logger;
  // this.config has higher priority than newConfig (we merge new low prio into exisiting high prio config)
  var modulesToDisable = _extractModulesToDisable(this.config);
  var priorityConfig = _flattenEnabledModules(this.config);
  _.compact(priorityConfig);

  ['browsers', 'specs'].forEach(function (key) {
    // there are some values that should be only overwritten from the command line (no merge).
    // if browsers are defined in both *.conf.js and command line, use command line parameters
    if (priorityConfig[key] && newConfig[key]) {
      logger.info(key + ' defined in both *.conf.js and --' + key + ' CLI argument, using --' + key + ' argument.');
      delete newConfig[key];
    }
  });


  for (var key in newConfig) {
    var modulesToEnable = [];
    if (newConfig[key]) {
      if (_.isArray(newConfig[key])) {
        modulesToEnable = newConfig[key];
      } else if (_.isArray(newConfig[key].enabled)) {
        modulesToEnable = newConfig[key].enabled;
      }
    }

    var applyModuleMerge = _.every(modulesToEnable, function (mModule) {
      return mModule.name || mModule.id;
    });
    if (applyModuleMerge) {
      if (_.isArray(priorityConfig[key])) {
        // if existing (high prio) config has data about the current key -> update it
        modulesToEnable.forEach(this._updateExistingKey(priorityConfig, key));
        // remove the already processed modules (to ensure compact values in final merge)
        _clearEnabledModules(newConfig, key);
      } else if (modulesToEnable && modulesToEnable.length) {
        // if existing (high prio) config doesn't have data about the current key -> add the new modules from the new (low prio) config
        modulesToEnable.forEach(function (moduleDef) {
          logger.debug('Adding module with ID "' + moduleDef.id + '" and name "' + moduleDef.name + '"' + 'under key "' + key + '"');
        });
        priorityConfig[key] = modulesToEnable;
        _clearEnabledModules(newConfig, key);
      }

      // if the new (low prio) config enables a module, but the existing (high prio) config disables it ->
      // delete the module from the new config
      this._disableModules(modulesToDisable, priorityConfig, key);
    }
  }

  // merge the loaded *.conf.js into glabal config
  this.config = _mergeWithArrays(newConfig, priorityConfig);
};

ConfigParser.prototype._resolveProfile = function (profile, resolvedConfig) {
  resolvedConfig = resolvedConfig || [];
  if (!profile) {
    return [];
  }
  var builtInFilePath = path.join(__dirname, CONFIG_DIR, profile + '.profile.conf.js');
  var fileConfig;

  if (fs.existsSync(builtInFilePath)) {
    fileConfig = this._readConfig(builtInFilePath);
  } else {
    fileConfig = this._readConfig(profile);
  }

  resolvedConfig.push(fileConfig);

  if (fileConfig.profile) {
    return this._resolveProfile(fileConfig.profile, resolvedConfig);
  } else {
    return resolvedConfig;
  }
};

ConfigParser.prototype.resolvePlaceholders = function(obj) {
  var that = this;
  _.forEach(obj, function(value, key) {
    if (_.isObject(value)) {
      that.resolvePlaceholders(value);
    } else if (_.isString(value)) {
      obj[key] = _.template(obj[key])(that.config);
    }
  });

  return obj;
};

// modifies this.config
// confKeys can be a single <key, value> pair or a list of pairs, separated by ; ( e.g.  --confKeys=a[0].key1:value1;a[1].key2:value2 )
// the pair value can be single or array, denoted by [] ( e.g. --confKeys:a[0].key.args="[--window-size=700,800, --headless]" )
ConfigParser.prototype._setConfKeys = function () {
  if (this.config.confKeys) {
    var allConfKeys = _.isArray(this.config.confKeys) ? this.config.confKeys : [this.config.confKeys];
    _.forEach(allConfKeys, function (confKeys) {
      var pairs = confKeys.split(';'); // split multiple pairs
      _.forEach(pairs, function (pair) {
        var parts = pair.split(':'); // split key, value
        var key = parts[0];
        var value = parts[1];
        if (value.match(/^\[.+\]$/gm)) {
          // value in the pair is an array
          value = _.compact(value.substr(1, value.length - 2).split(', '));
        }
        _.set(this.config, key, value);
      }.bind(this));
    }.bind(this));
  }
};

ConfigParser.prototype._updateExistingKey = function (config, key) {
  return function (newModule) {
    var existingModuleIndex = _findIndexOfModule(config, key, newModule);
    if (existingModuleIndex > -1) {
      // if the new (low prio) config enables a module, and it's also enabled in the existing (high prio) config ->
      // values from exising config override values from new config. new values in new config are also included
      this.logger.debug('Modifying module with ID "' + newModule.id + '" and name "' + newModule.name + '" under key "' + key + '".\nPrevious value: "' +
        JSON.stringify(newModule) + '". New value: ' + JSON.stringify(config[key][existingModuleIndex])) + '"' ;

      config[key][existingModuleIndex] = _.assign({}, newModule, config[key][existingModuleIndex]);
    } else {
      // if the new (low prio) config enables a module, and it's missing from the existing (high prio) config ->
      // add the new modules
      this.logger.debug('Adding module with ID "' + newModule.id + '" and name "' + newModule.name + '" under key "' + key + '"');
      config[key].push(newModule);
    }
  }.bind(this);
};

ConfigParser.prototype._disableModules = function (modulesToDisable, modules, key) {
  if (!_.isEmpty(modulesToDisable[key])) {
    _.remove(modules[key], function (moduleDef) {
      var existingModuleIndex = _findIndexOfModule(modulesToDisable, key, moduleDef);
      if (existingModuleIndex > -1) {
        this.logger.debug('Removing module with ID "' + moduleDef.id + '" and name "' + moduleDef.name + '" under key "' + key + '"');
        return true;
      }
    }.bind(this));
  }
};

ConfigParser.prototype._readConfig = function (configPath, type) {
  this.logger.debug('Loading ' + (type ? type + ' ': '') + 'config from: ' + configPath);
  // clone so we avoid module cache
  return _.cloneDeep(require(configPath).config);
};

ConfigParser.prototype._mergeParams = function () {
  // load config file
  this.conf = this._readConfig(this.config.conf || DEFAULT_CONF, 'default');

  var paramsFile = this.config.paramsFile || this.conf.paramsFile; 
  var exportParamsFile = this.config.exportParamsFile || this.conf.exportParamsFile;

  if (paramsFile) {
    this.conf.paramsFile = path.resolve(paramsFile);
    this.logger.debug('Loading test params from file ' + this.conf.paramsFile);
    var importParams = _.cloneDeep(require(this.conf.paramsFile));
    // cli params should have higher prio
    this.config.params = _mergeWithArrays(importParams, this.config.params);
  }

  if (exportParamsFile) {
    this.config.exportParamsFile = path.resolve(this.config.exportParamsFile);
    this.config.exportParams = {};
  }
};

function _mergeWithArrays(newObject, destination) {
  return _.mergeWith(newObject, destination, function (objectValue, sourceValue) {
    // return undefined to use _.merge default strategy: _.merge(object, src)
    if (_.isArray(objectValue) && sourceValue) {
      return _(objectValue).concat(sourceValue).uniqWith(_.isEqual).value();
    }
  });
}

function _flattenEnabledModules(config) {
  for (var key in config) {
    if (_.isPlainObject(config[key])) {
      if (config[key].enabled) {
        config[key] = config[key].enabled;
      }
    }
  }
  return config;
}

function _clearEnabledModules(config, key) {
  if (_.isArray(config[key])) {
    delete config[key];
  } else if (_.isArray(config[key].enabled)) {
    delete config[key].enabled;
  }
  if (_.isEmpty(config[key])) {
    delete config[key];
  }

  return config;
}

function _extractModulesToDisable(config) {
  var modulesToDisable = {};
  for (var key in config) {
    if (_.isPlainObject(config[key])) {
      if (config[key].disabled) {
        modulesToDisable[key] = config[key].disabled;
        delete config[key].disabled;
      }
    }
  }
  return modulesToDisable;
}

function _findIndexOfModule(config, key, newModuleDef) {
  return _.findIndex(config[key], function (moduleDef) {
    if (moduleDef.id) {
      return moduleDef.id === newModuleDef.id;
    } else if (moduleDef.name) {
      return moduleDef.name === newModuleDef.name;
    }
  });
}

module.exports = function(logger){
  return new ConfigParser(logger);
};
