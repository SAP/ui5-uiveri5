var webdriver = require('selenium-webdriver');
var _ = require('lodash');

/**
 * Control locator public class
 * @param {object} clientsidescripts object containing defnition of functions to be executed in the browser
 * Expected functions are findByControl and getLatestLog.
 * @param {object} logger optional logger object with methods: debug, info, error, trace. if not defined, no logs will be produced
 * @public
 */
function ControlLocator(clientsidescripts, logger) {
  this.clientsidescripts = _.assign({
    findByControl: _.noop,
    getLatestLog: _.noop
  }, clientsidescripts);
  this.logger = _.assign({
    debug: _.noop,
    info: _.noop,
    error: _.noop,
    trace: _.noop
  }, logger);
}

/**
 * Register control locator
 * @param {ProtractorBy} by protractor By object on which to add the new locator
 * @param {string} name name of the new locator (e.g. if name is "control", find elements with "by.control()")
 * @public
 */
ControlLocator.prototype.register = function (by, name) {
  by[name] = function (mMatchers) {
    var locator = new _ControlLocator(mMatchers, this.clientsidescripts, this.logger);
    return locator;
  }.bind(this);
};

/**
 * Apply control locator logic inside a registered locator
 * @param {object} mMatchers JSON object containing OPA5-style control search conditions and matchers
 */
ControlLocator.prototype.apply = function (mMatchers) {
  var locator = new _ControlLocator(mMatchers, this.clientsidescripts, this.logger);
  return locator;
};

/**
 * Control locator internal implementation
 * @param {object} mMatchers JSON object containing OPA5-style control search conditions and matchers
 * @implements {ProtractorLocator}
 */
function _ControlLocator(mMatchers, clientsidescripts, logger) {
  this.matchers = mMatchers;
  this.clientsidescripts = clientsidescripts;
  this.logger = logger;
}

/**
 * Register control locator
 * @param {WebDriver} driver webdriver which looks for elements
 * @param {WebElement} using element context (or document)
 * @param {string} rootSelector
 * @returns {wdpromise.Promise<WebElement[]>}
 */
_ControlLocator.prototype.findElementsOverride = function (driver, using, rootSelector) {
  if (this.matchers.id instanceof RegExp) {
    this.matchers.id = {
      regex: {
        source: this.matchers.id.source,
        flags: this.matchers.id.flags
      }
    };
  }
  if (this.matchers.properties) {
    Object.keys(this.matchers.properties).forEach(function (sProperty) {
      var vValue = this.matchers.properties[sProperty];
      if (vValue instanceof RegExp) {
        this.matchers.properties[sProperty] = {
          regex: {
            source: vValue.source,
            flags: vValue.flags
          }
        };
      }
    }.bind(this));
  }

  var sMatchers = JSON.stringify(this.matchers);

  return driver.findElements(webdriver.By.js(this.clientsidescripts.findByControl, sMatchers, using, rootSelector))
    .then(function (vResult) {
      if (vResult.length) {
        return vResult;
      } else {
        return driver.executeScript(this.clientsidescripts.getLatestLog)
          .then(function (sLatestLog) {
            this.logger.debug('No elements found using by.control locator. This is what control locator last logged: ' + sLatestLog);
            return vResult;
          }.bind(this));
      }
    }.bind(this));
};

/**
 * get a string representation of the locator for logging purposes
 * @returns {string}
 */
_ControlLocator.prototype.toString = function toString() {
  var sMatchers = JSON.stringify(this.matchers);
  return 'by.control(' + sMatchers + ')';
};

module.exports = ControlLocator;
