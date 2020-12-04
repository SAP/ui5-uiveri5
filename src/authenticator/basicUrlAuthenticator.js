
var webdriver = require('selenium-webdriver');

/**
 * Handle basic Url authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function BasicUrlAuthenticator(config,instanceConfig,logger){
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;

  this.user = instanceConfig.user;
  this.pass = instanceConfig.pass;
}

/**
 * Get the page and authenticates with provided credentials
 * @param {string} url - url to get
 * @returns {webdriver.promise<undefined|Error>} - resolved when the page is full loaded
 */
BasicUrlAuthenticator.prototype.get = function(url){
  if (!this.user || !this.pass) {
    return webdriver.promise.rejected(
      new Error('Basic auth requested but user or pass is not specified'));
  }

  // prepare basic auth url
  var urlMatches = url.match(/(\w*:?\/\/)(.+)/);
  if (urlMatches === null) {
    return webdriver.promise.rejected(
      new Error('Could not parse url: ' + url));
  }
  var urlWithAuth = urlMatches[1] + this.user + ':' + this.pass + '@' + urlMatches[2];

  // get the url
  return browser.driver.get(urlWithAuth);
};

module.exports = function(config,instanceConfig,logger){
  return new BasicUrlAuthenticator(config,instanceConfig,logger);
};
