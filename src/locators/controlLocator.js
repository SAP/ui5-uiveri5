var clientsidescripts = require('../scripts/clientsidescripts');
var webdriver = require('selenium-webdriver');
var _ = require('lodash');

/**
 * Control locator
 * @param {object} logger optional logger object with methods: debug, info, error, trace. if not defined, no logs will be produced
 * @public
 */
function ControlLocator(config, instanceConfig, logger, collector) {
  this.logger = _.extend({
    debug: _.noop,
    info: _.noop,
    error: _.noop,
    trace: _.noop
  }, logger);
  this.collector = collector;
}

/**
 * Register control locator
 * @param {ProtractorBy} by protractor By object on which to add the new locator
 * @public
 */
ControlLocator.prototype.register = function (by) {
  this.logger.debug('Registering control locator');
  by.control = function (mMatchers) {
    var locator = new _ControlLocator(mMatchers, this.logger, this.collector);
    return locator;
  }.bind(this);
};

/**
 * Apply control locator logic inside a registered locator.
 * @param {object} mMatchers JSON object containing OPA5-style control search conditions and matchers
 */
ControlLocator.prototype.apply = function (mMatchers) {
  var locator = new _ControlLocator(mMatchers, this.logger, this.collector);
  return locator;
};

/**
 * Control locator internal implementation
 * @param {object} mMatchers JSON object containing OPA5-style control search conditions and matchers
 * @implements {ProtractorLocator}
 */
function _ControlLocator(mMatchers, logger, collector) {
  this.matchers = mMatchers;
  this.logger = logger;
  this.collector = collector;
}

/**
 * Register control locator
 * @param {WebDriver} driver webdriver which looks for elements
 * @param {WebElement} using element context (or document)
 * @param {string} rootSelector
 * @returns {wdpromise.Promise<WebElement[]>}
 */
_ControlLocator.prototype.findElementsOverride = function (driver, using, rootSelector) {
  this._convertRegexToPlainObject(this.matchers);

  var sMatchers = JSON.stringify(this.matchers);

  return driver.findElements(webdriver.By.js(clientsidescripts.findByControl, sMatchers, using, rootSelector))
    .then(function (vResult) {
      if (vResult.length) {
        return vResult;
      } else {
        return driver.executeScript(clientsidescripts.getLatestLog)
          .then(function (sLatestLog) {
            var details = 'No elements found using by.control locator. This is what control locator last logged: ' + sLatestLog;
            this.logger.info(details);
            this.collector.collectLog(details);
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

_ControlLocator.prototype._convertRegexToPlainObject = function (matchers) {
  for (var name in matchers) {
    if (matchers[name] instanceof RegExp) {
      // e.g. id matcher
      matchers[name] = {
        regex: {
          source: matchers[name].source,
          flags: matchers[name].flags
        }
      };
    } else if (_.isPlainObject(matchers[name])) {
      // e.g. properties matcher
      for (var key in matchers[name]) {
        var vValue = matchers[name][key];
        if (vValue instanceof RegExp) {
          matchers[name][key] = {
            regex: {
              source: vValue.source,
              flags: vValue.flags
            }
          };
        } else if (_.isPlainObject(vValue)) {
          // transform nested matchers e.g. ancestor, descendant
          this._convertRegexToPlainObject(matchers[name][key]);
        }
      }
    }
  }
};

module.exports = function (config, instanceConfig, logger, collector) {
  return new ControlLocator(config, instanceConfig, logger, collector);
};
