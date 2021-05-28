var fs = require('fs');
var logger = require('../logger');

module.exports = function (config) {
  return {
    register: function () {
      if (config.exportParamsFile) {
        jasmine.getEnv().addReporter({
          jasmineDone: function () {
            logger.debug('Exporting test params to file ' + config.exportParamsFile);
            fs.writeFileSync(config.exportParamsFile, JSON.stringify(browser.testrunner.config.exportParams, null, 2));
          }
        });
      }
    }
  };
};
