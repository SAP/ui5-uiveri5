
/**
 * Handle page authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function UI5FormAuthenticator(config,instanceConfig,logger){
  //this.config = config;
  //this.instanceConfig = instanceConfig;
  this.logger = logger;

  this.user = instanceConfig.user;
  this.pass = instanceConfig.pass;
  this.userFieldSelector = instanceConfig.userFieldSelector;
  this.passFieldSelector = instanceConfig.passFieldSelector;
  this.logonButtonSelector = instanceConfig.logonButtonSelector;
}

/**
 * Get the page and authenticates with provided credentials
 * @param {string} url - url to get
 * @returns {promise<>} - resolved when the page is full loaded
 */
UI5FormAuthenticator.prototype.get = function(url){
  if (!this.user || !this.pass) {
    return webdriver.promise.rejected(
      new Error('UI5 Form auth requested but user or pass is not specified'));
  }

  // open the page
  browser.driver.get(url);

  // synchronize with UI5 on credentials page
  browser.waitForAngular();

  // enter user and pass in the respective fields
  element(by.css(this.userFieldSelector));
  element(by.css(this.passFieldSelector));
  return element(by.css(this.logonButtonSelector)).click();
};

module.exports = function(config,logger){
  return new UI5FormAuthenticator(config,logger);
};
