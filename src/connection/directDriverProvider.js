var path = require('path');
var _ = require('lodash');
var q = require('q');

// replaces ptor driverProviders
var DirectDriverProvider = function (protConfig, logger, seleniumConfig, plugins) {
  this.protConfig = protConfig;
  this.logger = logger;
  this.seleniumConfig = seleniumConfig;
  this.plugins = plugins;
  this.drivers = [];

  // use selenium-webdriver from protractor dependecies
  this.deps = {};
  this.deps.webdriver = require('selenium-webdriver');
  this.deps.http = require('selenium-webdriver/http');
  this.deps.remote = require('selenium-webdriver/remote');
  this.deps.command = require('selenium-webdriver/lib/command.js');
};

DirectDriverProvider.prototype.setupEnv = function() {
  return q();
};

DirectDriverProvider.prototype.getExistingDrivers = function() {
  return this.drivers.slice();
};

/**
 * Create a new driver augmented with appium support
 * @public
 * @override
 * @return webdriver instance
 */
DirectDriverProvider.prototype.getNewDriver = function() {
  var that = this;

  // cleanup required capabilities from any non-webdriver related options
  var requiredCapabilities = _.cloneDeep(this.protConfig.capabilities);
  delete requiredCapabilities.runtime;
  delete requiredCapabilities.remoteWebDriverOptions;

  this.plugins.onConnectionSetup(requiredCapabilities);

  that.logger.info('Opening webdriver connection with capabilities: ' +
    JSON.stringify(requiredCapabilities));

  // open webdriver connection, start local webdriver if necessary
  var capabilities = new that.deps.webdriver.Capabilities(requiredCapabilities);
  var driver;
  if (that.seleniumConfig.address) {
    that.logger.debug('Opening remote webdriver session to: ' + that.seleniumConfig.address);

    if (that.seleniumConfig.addressProxy) {
      that.logger.debug('Using proxy for webdriver connection: ' + that.seleniumConfig.addressProxy);
    }
    // connect to remote selenium
    var client = new that.deps.http.HttpClient(that.seleniumConfig.address, null,that.seleniumConfig.addressProxy);
    var executor =  new that.deps.http.Executor(client);
    driver = that.deps.webdriver.WebDriver.createSession(executor,capabilities);

    //augment with appium support
    var CONTEXT_COMMAND = 'context';
    executor.defineCommand(CONTEXT_COMMAND,'POST','/session/:sessionId/context');

    driver.switchContext = function (name) {
      that.logger.debug('Switch context to: ' + name);
      return driver.schedule(
        new that.deps.command.Command(CONTEXT_COMMAND)
          .setParameter('name', name),
        'WebDriver.switchContext()'
      );
    };
  } else {
    // start local driver
    if (that.seleniumConfig.useSeleniumJarFlag) {
      // by default selenium is started without specifying host, on findFreePort, returns net.getAddress()
      // host, port and returned host could be overridden
      that.logger.debug('Starting local selenium server with executable: ' +
        that.seleniumConfig.executables.selenium);

      // set selenium options
      var opts = {
        args: []
      };
      // port
      if (that.seleniumConfig.port){
        opts.port = that.seleniumConfig.port;
      }
      // host
      if (that.seleniumConfig.host){
        opts.args = opts.args.concat(['-host',that.seleniumConfig.host]);
      }

      // seleniumOptions.args
      if(requiredCapabilities.seleniumOptions && requiredCapabilities.seleniumOptions.args){
        opts.args = opts.args.concat(requiredCapabilities.seleniumOptions.args);
      }
      // local webdriver binaries
      opts.jvmArgs = [];
      var browserName = requiredCapabilities.browserName;
      if (browserName == 'chrome') {
        opts.jvmArgs.push('-Dwebdriver.chrome.driver=' + that.seleniumConfig.executables.chromedriver);
      } else if (browserName == 'firefox') {
        opts.jvmArgs.push('-Dwebdriver.gecko.driver=' + that.seleniumConfig.executables.geckodriver);
      } else if (browserName == 'internet explorer') {
        opts.jvmArgs.push('-Dwebdriver.ie.driver=' + that.seleniumConfig.executables.iedriver);
      } else if (browserName == 'MicrosoftEdge') {
        opts.jvmArgs.push('-Dwebdriver.edge.driver=' + that.seleniumConfig.executables.edgedriver);
      }

      var seleniumServer = new that.deps.remote.SeleniumServer(that.seleniumConfig.executables.selenium,opts);

      // loopback connecting to selenium server
      that.seleniumConfig.seleniumLoopback ? seleniumServer.loopbackOnly_ = true : seleniumServer.loopbackOnly_ = false;

      // start the selenium server, override the host if necessary
      var addressPromise = seleniumServer.start().then(
        function(address){
          that.logger.debug('Selenium server started and listening at: ' + address);
          return address;
        }
      );

      // start the remote webdriver against this local selenium server
      executor = new that.deps.http.Executor(
        that.deps.webdriver.promise.when(addressPromise, function (url) {
          return new that.deps.http.HttpClient(url, null);
        })
      );
      driver = that.deps.webdriver.WebDriver.createSession(executor,capabilities);
    } else  {
      // switch on browser
      browserName = requiredCapabilities.browserName;
      if (browserName == 'chrome' || browserName == 'chromium') {
        that.deps.chrome = require('selenium-webdriver/chrome');

        // chromedriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        that.logger.debug('Starting local chromedriver with executable: ' +
          that.seleniumConfig.executables.chromedriver);

        var chromeServiceBuilder = new that.deps.chrome.ServiceBuilder(that.seleniumConfig.executables.chromedriver);
        // set chromedriverOptions
        _.forIn(requiredCapabilities.chromedriverOptions, function (value, key) {
          chromeServiceBuilder[key].apply(chromeServiceBuilder, _asArray(value));
        });

        // build chromeOptions from capabilities
        var chromeOptions = that.deps.chrome.Options.fromCapabilities(capabilities);

        // start the local chromedriver and connect to it
        var chromeService = chromeServiceBuilder.build();
        driver =  that.deps.chrome.Driver.createSession(
          chromeOptions,chromeService);
      } else if (browserName == 'firefox') {
        that.deps.firefox = require('selenium-webdriver/firefox');

        // geckodriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        that.logger.debug('Starting local geckodriver with executable: ' + 
          that.seleniumConfig.executables.geckodriver);

        var firefoxServiceBuilder = new that.deps.firefox.ServiceBuilder(that.seleniumConfig.executables.geckodriver);

        // set geckodriverOptions
        _.forIn(requiredCapabilities.geckodriverOptions, function (value, key) {
          firefoxServiceBuilder[key].apply(firefoxServiceBuilder, _asArray(value));
        });

        // no firefox.Options.fromCapabilities() so need to build firefoxOptions manually
        var firefoxOptions = new that.deps.firefox.Options();
        _.forIn(requiredCapabilities.firefoxOptions, function (value, key) {
          firefoxOptions[key].apply(firefoxOptions, _asArray(value));
        });

        // start the local geckodriver and connect to it
        var firefoxService = firefoxServiceBuilder.build();
        driver =  that.deps.firefox.Driver.createSession(
          firefoxOptions,firefoxService);
      } else if (browserName == 'internet explorer') {
        that.deps.ie = require('selenium-webdriver/ie');

        // iedriver is started without specifying host, on findFreePort, returns getLoopbackAddress
        that.logger.debug('Starting local iedriver with executable: ' +
          that.seleniumConfig.executables.iedriver);

        // set iedriver executable
        process.env.PATH = process.env.PATH + path.delimiter + path.dirname(that.seleniumConfig.executables.iedriver);

        var driverOptions = new that.deps.ie.Options();
        _.forIn(requiredCapabilities.iedriverOptions, function (value, key) {
          var funcName = key;
          if (funcName.startsWith('ie.')) {
            funcName = funcName.substring(3);
          }
          that.deps.ie.Options.prototype[funcName].apply(driverOptions, _asArray(value));
        });
        var browserOptions = new that.deps.ie.Options();
        _.forIn(requiredCapabilities.ieOptions, function (value, key) {
          that.deps.ie.Options.prototype[key].apply(browserOptions, _asArray(value));
        });

        // merge capabilities
        var allIECapabilities = driverOptions.toCapabilities(browserOptions.toCapabilities());
        // start the local iedriver and connect to it
        driver = that.deps.ie.Driver.createSession(that.deps.ie.Options.fromCapabilities(allIECapabilities));
      } else if (browserName == 'MicrosoftEdge') {
        that.deps.edge = require('selenium-webdriver/edge');

        that.logger.debug('Starting local edgedriver with executable: ' +
          that.seleniumConfig.executables.edgedriver);

        var edgeOptions = [new that.deps.edge.Options(), new that.deps.edge.Options()];
        _.forEach(['edgedriverOptions', 'edgeOptions'], function (capabilitiesKey, index) {
          _.forIn(that.protConfig.capabilities[capabilitiesKey], function (value, key) {
            that.deps.edge.Options.prototype[key].apply(edgeOptions[index], _asArray(value));
          });
        });
        // merge capabilities
        var allEdgeCapabilities = edgeOptions[0].toCapabilities(edgeOptions[1].toCapabilities());

        // start the local edgedriver and connect to it
        var edgeServiceBuilder = new that.deps.edge.ServiceBuilder(that.seleniumConfig.executables.edgedriver);
        driver =  that.deps.edge.Driver.createSession(allEdgeCapabilities, edgeServiceBuilder.build());
      } else if (browserName == 'safari') {
        that.deps.safari = require('selenium-webdriver/safari');

        // by default safari server always started at 'localhost' and findFreePort, returns 'localhost'
        // nothing could be overridden
        that.logger.debug('Starting local safaridriver from system path');

        var safariServiceBuilder = new that.deps.safari.ServiceBuilder();

        // set safaridriverOptions
        _.forIn(requiredCapabilities.safaridriverOptions, function (value, key) {
          safariServiceBuilder[key].apply(safariServiceBuilder, _asArray(value));
        });

        // build safariOptions from capabilities
        var safariOptions = that.deps.safari.Options.fromCapabilities(capabilities);

        // start the local safaridriver and connect to it
        driver = new that.deps.webdriver.Builder()
          .withCapabilities(safariOptions.toCapabilities())
          .usingServer(safariServiceBuilder.build().start())
          .build();
      } else {
        throw new Error('Browser with name: ' + browserName + ' is not supported');
      }
    }
  }

  this.drivers.push(driver);
  return driver;
};

DirectDriverProvider.prototype.quitDriver = function(driver) {
  var driverIndex = this.drivers.indexOf(driver);
  if (driverIndex >= 0) {
    this.drivers.splice(driverIndex, 1);
  }

  var deferred = q.defer();
  driver.getSession().then(function(session_) {
    if (session_) {
      driver.quit().then(function() {
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
  });
  return deferred.promise;
};

DirectDriverProvider.prototype.teardownEnv = function() {
  return q.all(this.drivers.map(this.quitDriver.bind(this)));
};

function _asArray(value) {
  return _.isArray(value) ? value : [value];
}

module.exports = DirectDriverProvider;
