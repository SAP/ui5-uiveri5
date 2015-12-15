
/**
 * Handle no Url authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function PlainAuthenticator(config,instanceConfig,logger) {
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  //this.logger = logger;
}

/**
 * Get the page without authentication
 * @param {string} url - url to get
 * @returns {webdriver.promise<undefined|Error>} - resolved when the page is full loaded
 */
PlainAuthenticator.prototype.get = function(url){
  // get the url
  return browser.driver.get(url);
};

module.exports = function(config,logger){
  return new PlainAuthenticator(config,logger);
};
