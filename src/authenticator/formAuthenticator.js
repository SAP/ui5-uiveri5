
/**
 * Handle page authentication
 * @constructor
 * @param {Config} config
 * @param {Object} instanceConfig
 * @param {Logger} logger
 */
function FormAuthenticator(config,instanceConfig,logger){
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
FormAuthenticator.prototype.get = function(url){
  var that = this;

  if (!this.user || !this.pass) {
    return webdriver.promise.rejected(
      new Error('Form auth requested but user or pass is not specified'));
  }

  // webdriver statements are synchronized by webdriver flow so no need to join the promises

  // open the page
  browser.driver.get(url);

  // wait till page is fully rendered
  browser.driver.wait(function(){
    return browser.driver.isElementPresent(by.css(that.userFieldSelector));
  },3000);

  // enter user and pass in the respective fields
  browser.driver.findElement(by.css(this.userFieldSelector)).sendKeys(this.user);
  browser.driver.findElement(by.css(this.passFieldSelector)).sendKeys(this.pass);
  return browser.driver.findElement(by.css(this.logonButtonSelector)).click();
};

module.exports = function(config,logger){
  return new FormAuthenticator(config,logger);
};
