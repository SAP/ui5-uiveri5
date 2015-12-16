
var _ = require('lodash');

var DEFAULT_CONF = '../conf/default.conf.js';

function ConfigParser(logger){
  this.logger = logger;
}

ConfigParser.prototype.mergeConfigs = function(config){

  // load config file
  var configFileName = config.conf || DEFAULT_CONF;
  this.logger.debug('Loading config from: ' + configFileName);
  var configFromConfigFile = require(configFileName).config;
  config = _mergeConfig(configFromConfigFile,config);

  // resolve profile
  var profileConfigFileName;
  if (config.profile){
    profileConfigFileName = '../conf/' + config.profile + '.profile.conf.js';
    this.logger.debug('Loading profile config from: ' + profileConfigFileName);
    var configFromProfileConfigFile = require(profileConfigFileName).config;
    config = _mergeConfig(configFromProfileConfigFile,config);
  }

  // apply common profile
  profileConfigFileName = '../conf/profile.conf.js';
  this.logger.debug('Loading common profile config from: ' + profileConfigFileName);
  var configFromDefaultProfileConfigFile = require(profileConfigFileName).config;
  config = _mergeConfig(configFromDefaultProfileConfigFile,config);

  // return new fully merged config
  return config;
};

/**
 * Merge objects and arrays
 */
function _mergeConfig(object,src){
  return _.merge(object,src,function(objectValue,sourceValue){
    if (_.isArray(objectValue)) {
      return objectValue.concat(sourceValue);
    }
  });
};

module.exports = function(logger){
  return new ConfigParser(logger);
};
