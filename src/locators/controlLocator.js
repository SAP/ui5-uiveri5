var clientsidescripts = require('../scripts/clientsidescripts');
var webdriver = require('selenium-webdriver');
var _ = require('lodash');

/**
 * Control locator
 * @param {object} logger optional logger object with methods: debug, info, error, trace. if not defined, no logs will be produced
 * @public
 */
function ControlLocator(config, instanceConfig, logger) {
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
 * @public
 */
ControlLocator.prototype.register = function (by) {
  this.logger.debug('Registering control locator');
  by.control = function (mMatchers) {
    var locator = new _ControlLocator(mMatchers, this.logger);
    return locator;
  }.bind(this);
};

/**
 * Apply control locator logic inside a registered locator.
 * @param {object} mMatchers JSON object containing OPA5-style control search conditions and matchers
 */
ControlLocator.prototype.apply = function (mMatchers) {
  var locator = new _ControlLocator(mMatchers, this.logger);
  return locator;
};

/**
 * Control locator internal implementation
 * @param {object} mMatchers JSON object containing OPA5-style control search conditions and matchers
 * @implements {ProtractorLocator}
 */
function _ControlLocator(mMatchers, logger) {
  this.matchers = mMatchers;
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

  return driver.findElements(webdriver.By.js(clientsidescripts.findByControl, sMatchers, using, rootSelector))
    .then(function (vResult) {
      if (vResult.length) {
        return vResult;
      } else {
        return driver.executeScript(clientsidescripts.getLatestLog)
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

module.exports = function (config, instanceConfig, logger) {
  return new ControlLocator(config, instanceConfig, logger);
};
