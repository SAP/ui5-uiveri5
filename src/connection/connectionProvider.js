var DEFAULT_CONNECTION_NAME = 'direct';
var connection;

var ConnectionProvider = function () { };

ConnectionProvider.prototype.verifyConfig = function (config) {
  var connectionName = config.connection || DEFAULT_CONNECTION_NAME;
  var connectionConfig = config.connectionConfigs[connectionName];
  if (!connectionConfig) {
    throw Error('Could not find connection: ' + connectionName);
  }
};

ConnectionProvider.prototype.setConnection = function (connectionModule) {
  connection = connectionModule;
};

ConnectionProvider.prototype.getConnection = function () {
  return connection;
};

module.exports = new ConnectionProvider();
