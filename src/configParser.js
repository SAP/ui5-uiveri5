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
  
  // if browsers are defined in both *.conf.js and command line, use command line parameters
  if (this.config.browsers && newConfig.browsers) {
    this.logger.info('Browsers defined in both *.conf.js and --browsers CLI argument, using --browsers argument.');
    delete newConfig.browsers;
  }

  // merge the loaded *.conf.js into glabal config
  this.config = _mergeWithArrays(newConfig,this.config);
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

function _mergeWithArrays(object, src) {
  // return _.merge(object, src)
  return _.mergeWith(object, src, function (objectValue, sourceValue) {
    // return undefined to use _.merge default strategy
    if (_.isArray(objectValue) && sourceValue) {
      return _(objectValue).concat(sourceValue).uniqWith(_.isEqual).value();
    }
  });
}

module.exports = function(logger){
  return new ConfigParser(logger);
};
