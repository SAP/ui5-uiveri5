var _ = require('lodash');

var DEFAULT_CONF = '../conf/default.conf.js';

function ConfigParser(logger) {
  this.logger = logger;
  this.config = {};
}

ConfigParser.prototype.mergeConfigs = function (config) {
  this.config = config;

  // load config file
  this._mergeConfig(this.config.conf || DEFAULT_CONF, 'default');

  // resolve profile
  if (this.config.profile) {
    this._mergeConfig('../conf/' + this.config.profile + '.profile.conf.js', 'profile config');
  }

  // apply common profile
  this._mergeConfig('../conf/profile.conf.js', 'common profile');

  // Changing config via confKeys
  this._setConfKeys();

  // return new fully merged config
  return this.config;
};

ConfigParser.prototype._mergeConfig = function (configFile, type) {
  var logger = this.logger;
  logger.debug('Loading ' + type + ' config from: ' + configFile);
  var newConfig = _.cloneDeep(require(configFile).config);  // clone so we avoid module cache
  // this.config has higher priority than newConfig (we merge new low prio into exisiting high prio config)
  var priorityConfig = _flattenEnabledModules(this.config);
  var modulesToDisable = _extractModulesToDisable(priorityConfig);
  _.compact(priorityConfig);

  // if browsers are defined in both *.conf.js and command line, use command line parameters
  if (priorityConfig.browsers && newConfig.browsers) {
    logger.info('Browsers defined in both *.conf.js and --browsers CLI argument, using --browsers argument.');
    delete newConfig.browsers;
  }

  for (var key in newConfig) {
    var modulesToEnable = [];
    if (_.isArray(newConfig[key]) && newConfig[key]) {
      modulesToEnable = newConfig[key];
    } else if (_.isArray(newConfig[key].enabled) && newConfig[key].enabled) {
      modulesToEnable = newConfig[key].enabled;
    }
    if (_.isArray(priorityConfig[key])) {
      // if existing (high prio) config has data about the current key -> update it
      modulesToEnable.forEach(this._updateExistingKey(priorityConfig, key));
    } else if (modulesToEnable && modulesToEnable.length) {
      // if existing (high prio) config doesn't have data about the current key -> add the new modules from the new (low prio) config
      modulesToEnable.forEach(function (moduleDef) {
        logger.debug('Adding module with ID "' + moduleDef.id + '" and name "' + moduleDef.name + '"' + 'under key "' + key + '"');
      });
      priorityConfig[key] = modulesToEnable;
    }

    // if the new (low prio) config enables a module, but the existing (high prio) config disables it ->
    // delete the module from the new config
    this._disableModules(modulesToDisable, modulesToEnable, key);

    // finally, remove the already processed enabled modules, before merging with the high priority config
    _clearEnabledModules(newConfig, key);
  }

  // merge the loaded *.conf.js into glabal config
  this.config = _mergeWithArrays(newConfig, priorityConfig);
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

ConfigParser.prototype._setConfKeys =  function() {
  var confKeys = this.config.confKeys;
  var config = this.config;
  if (confKeys) {
    if (_.isArray(confKeys)) {
      _.forEach(confKeys,function(key) {
        _setConfKey(config,key);
      });
    } else {
      _setConfKey(config,confKeys);
    }
  }
  this.config = config;
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
    _.remove(modules, function (moduleDef) {
      var existingModuleIndex = _findIndexOfModule(modulesToDisable, key, moduleDef);
      if (existingModuleIndex > -1) {
        this.logger.debug('Removing module with ID "' + moduleDef.id + '" and name "' + moduleDef.name + '" under key "' + key + '"');
        return true;
      }
    }.bind(this));
  }
};

function _setConfKey(config,confKey) {
  var pairs = confKey.split(';');
  _.forEach(pairs,function(pair) {
    var columnCharIndex = pair.indexOf(':');
    if (columnCharIndex === -1) {
      return;
    }
    _.set(config,pair.substr(0,columnCharIndex),pair.substr(columnCharIndex+1));
  });
}

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
  if (_.isArray(config[key]) && config[key]) {
    delete config[key];
  } else if (_.isArray(config[key].enabled) && config[key].enabled) {
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
