var q = require('q');
var request = require('request');
var _ = require('lodash');

function LatestDriverVersionResolver(config, instanceConfig, logger) {
  this.logger = logger;
  this.latestVersionRegexp = instanceConfig.latestVersionRegexp;
}

LatestDriverVersionResolver.prototype.getLatestVersion = function (binary) {
  var that = this;
  if (binary.latestVersionFileUrl || binary.latestVersionUrlRedirect) {
    return that._getLatestMajorVersionFromFile(binary)
      .then(function (result) {
        if (result.latestMajorVersion) {
          binary.latestVersionUrl = binary.latestVersionUrl.replace(that.latestVersionRegexp, result.latestMajorVersion);
        }
        return that._getLatestDriverVersion(binary);
      });
  } else if (binary.latestCompleteVersionFileUrl)  {
    return that._getLatestCompleteVersionFromFile(binary);
  }
};

LatestDriverVersionResolver.prototype._getLatestCompleteVersionFromFile = function (binary) {
  var that = this;

  that.logger.info('Check for latest complete version of: ' + binary.filename);
  return q.Promise(function (resolveFn, rejectFn) {
    if (binary.latestCompleteVersionFileUrl) {
      request({
        url: binary.latestCompleteVersionFileUrl
      }, function (error, res, body) {
        if (_hasError(error, res)) {
          rejectFn(_buildErrorObject(error, res, binary.filename, 'the latest major version number'));
        } else {
          that.logger.info('Check latest version file url: ' + binary.latestCompleteVersionFileUrl);
          var latestVersion = _parseVersionNumber(body, binary.version);
          that.logger.info('Found latest complete version of ' + binary.filename + ': ' + latestVersion);
          resolveFn({
            latestVersion: latestVersion
          });
        }
      });
    } else {
      resolveFn({});
    }
  });
};

LatestDriverVersionResolver.prototype._getLatestMajorVersionFromFile = function (binary) {
  var that = this;

  that.logger.info('Check for latest major version of: ' + binary.filename);
  return q.Promise(function (resolveFn, rejectFn) {
    if (binary.latestVersionFileUrl) {
      request({
        url: binary.latestVersionFileUrl
      }, function (error, res, body) {
        if (_hasError(error, res)) {
          rejectFn(_buildErrorObject(error, res, binary.filename, 'the latest major version number'));
        } else {
          that.logger.info('Check latest version file url: ' + binary.latestVersionFileUrl);
          var latestMajorVersion = _parseVersionNumber(body, binary.version);
          that.logger.info('Found latest major version of ' + binary.filename + ': ' + latestMajorVersion);
          resolveFn({
            latestMajorVersion: latestMajorVersion
          });
        }
      });
    } else {
      resolveFn({});
    }
  });
};

LatestDriverVersionResolver.prototype._getLatestDriverVersion = function (binary) {
  var that = this;

  that.logger.info('Check for latest version of: ' + binary.filename);
  return q.Promise(function (resolveFn, rejectFn) {
    request({
      url: binary.latestVersionUrlRedirect || binary.latestVersionUrl
    }, function (error, res, body) {
      if(_hasError(error, res)) {
        rejectFn(_buildErrorObject(error, res, binary.filename, 'the latest version number'));
      } else {
        var latestVersion;

        // resolve latest version
        if(binary.latestVersionUrl) {
          latestVersion = body;
        } else if(binary.latestVersionUrlRedirect) {
          // request to the latest version is redirected to the latest release, so get the version from req.path
          var redirectPath = res.req.path.split('/');
          latestVersion = redirectPath[redirectPath.length - 1];
        }

        if (latestVersion) {
          that.logger.info('Found latest version of ' + binary.filename + ': ' + latestVersion);
          resolveFn({
            latestVersion: latestVersion
          });
        } else {
          rejectFn(new Error('Latest version resolving is not configured correctly, one of latestVersionUrl: ' + binary.latestVersionUrl +
          ' or latestVersionUrlRedirect: ' + binary.latestVersionUrlRedirect + ' should be provided'));
        }
      }
    });
  });
};

function _hasError(error, res) {
  return error || res.statusCode != 200;
}

function _buildErrorObject(error, res, filename, info) {
  return new Error('Error while getting ' + info + ' for ' + filename +
    (error ? (', error: ' + error) :
      (res && res.statusCode ? (', status code: ' + res.statusCode) : '')));
}

function _parseVersionNumber(body, versionName) {
  var pathToNumber = versionName.replace(/{|}/g, '');
  if (body && typeof body === 'string') {
    var jsonBody = JSON.parse(body);
    var number = _.get(jsonBody, pathToNumber, '').toString().trim();
    if (number.match(/^([0-9]+\.*)+$/)) {
      return number;
    }
  }
}

module.exports = function(config, instanceConfig, logger) {
  return new LatestDriverVersionResolver(config, instanceConfig, logger);
};
