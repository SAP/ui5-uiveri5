function getOSTypeString() {
  var os = require('os');
  var osType = '';

  if (os.type() == 'Darwin') {
    osType = 'mac64';
  } else if (os.type() == 'Linux') {
    if (os.arch() == 'x64') {
      osType = 'linux64';
    } else {
      osType = 'linux32';
    }
  } else if (os.type() == 'Windows_NT') {
    osType = 'win32';
  } else {
    osType = 'unknown';
  }

  return osType;
}

function getUIVeri5Version() {
  var pjson = require('../../package.json');
  return pjson.name + ' v' + pjson.version;
}

module.exports = {
  getOSTypeString: getOSTypeString,
  getUIVeri5Version: getUIVeri5Version
};
