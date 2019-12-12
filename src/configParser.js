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
  this.logger.debug('Loading ' + type + ' config from: ' + configFile);
  var newConfig = _.clone(require(configFile).config);  // clone so we avoid module cache
  var highPrioConfig = this.config; // this.config has higher prio than newConfig

  // if browsers are defined in both *.conf.js and command line, use command line parameters
  if (highPrioConfig.browsers && newConfig.browsers) {
    this.logger.info('Browsers defined in both *.conf.js and --browsers CLI argument, using --browsers argument.');
    delete newConfig.browsers;
  }

  var logger = this.logger;
  var highPrioDisabled = {};

  // flatten enabled modules
  for (var key in highPrioConfig) {
    if (_.isPlainObject(highPrioConfig[key])) {
      if (highPrioConfig[key].disabled) {
        highPrioDisabled[key] = highPrioConfig[key].disabled;
      }
      if (highPrioConfig[key].enabled) {
        highPrioConfig[key] = highPrioConfig[key].enabled;
      }
    }
  }
  // if a config with lower prio enables a module:
  // 1. if it exists and is enabled in higher prio -> use only props from lower prio that are missing in higher
  // 2. if it doesn't exist in higher prio -> add it
  // 3. if it was disabled in higher prio -> delete from lower prio
  for (var key in newConfig) {
    var arrayToEnable = _.isArray(newConfig[key]) && newConfig[key] || (_.isArray(newConfig[key].enabled) && newConfig[key].enabled) || [];
    if (_.isArray(highPrioConfig[key])) {
      arrayToEnable.forEach(function (newVal) {
        var existingVal = _.find(highPrioConfig[key], function (val) {
          var bAdd = false;
          if (val.id) {
            bAdd = val.id === newVal.id;
            if (bAdd) {
              logger.debug('====Enabling module with ID "' + newVal.id + '" and name "' + newVal.name + '"');
            }
          } else if (val.name) {
            bAdd = val.name === newVal.name;
            if (bAdd) {
              logger.debug('====Enabling module with name "' + newVal.name + '"');
            }
          }
          return bAdd;
        });
        if (existingVal) {
          // 1.
          logger.debug('====Modifying module with ID "' + newVal.id + '" and name "' + newVal.name + '"' + JSON.stringify(newVal) + JSON.stringify(existingVal))  ;
          existingVal = _.assign({}, newVal, existingVal); // existingVal values should override newVal values
        } else {
          // 2.
          logger.debug('====Adding module with ID "' + newVal.id + '" and name "' + newVal.name + '"');
          highPrioConfig[key].push(newVal);
        }
      });
    } else if (!_.isEmpty(highPrioDisabled[key])) {
      // 3.
      _.remove(arrayToEnable, function (val) {
        return _.find(highPrioDisabled[key], function (disabledVal) {
          var bRemove = false;
          if (disabledVal.id) {
            bRemove = disabledVal.id === val.id;
            if (bRemove) {
              logger.debug('====Removing module with ID "' + val.id + '" and name "' + val.name + '"');
            }
          } else if (disabledVal.name) {
            bRemove = disabledVal.name === val.name;
            if (bRemove) {
              logger.debug('====Removing module with name "' + val.name + '"');
            }
          }
          return bRemove;
        });
      })
    } else if (arrayToEnable && arrayToEnable.length) {
      // 2.
      logger.debug('====Adding modules ' + arrayToEnable);
      highPrioConfig[key] = arrayToEnable;
    }
  }
  // at the end, remove the already processed arrayToEnable
  if (_.isArray(newConfig[key]) && newConfig[key]) {
    delete newConfig[key];
  } else if (_.isArray(newConfig[key].enabled) && newConfig[key].enabled) {
    delete newConfig[key].enabled;
  }

  // merge the loaded *.conf.js into glabal config
  this.config = _mergeWithArrays(newConfig, this.config);
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

module.exports = function(logger){
  return new ConfigParser(logger);
};
