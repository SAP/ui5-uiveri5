var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var logger = require('../logger');

module.exports = {
  saveReport: function (reportName, content) {
    mkdirp.sync(reportName.substring(0, reportName.lastIndexOf(path.sep)));
    fs.writeFileSync(reportName, content);
  },
  deleteReport: function (reportName, reportType) {
    try {
      fs.unlinkSync(reportName);
      logger.debug(reportType + ' report: ' + reportName + ' is successfully deleted.');
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.error('Error while trying to delete ' + reportType + ' report file:' + reportName + ', error: ' + err);
      }
    }
  },
  createDir: function (dir) {
    try {
      fs.statSync(dir);
    } catch (err) {
      mkdirp.sync(dir);
      logger.debug('Report screenshots directory: ' + dir + ' is successfully created.');
    }
  }
};
