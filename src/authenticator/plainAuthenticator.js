
/**
 * Handle no Url authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function PlainAuthenticator() {
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
  var that = this;

  // get the url
  browser.driver.get(that.authUrl ? that.authUrl : url);

  // ensure possible redirect due to SSO client-auth is completed
  return browser.testrunner.navigation.waitForRedirect(url);
};

module.exports = function(config,logger){
  return new PlainAuthenticator(config,logger);
};
