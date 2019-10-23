var _ = require('lodash');
var clientsidescripts = require('./scripts/clientsidescripts');
var AUTH_CONFIG_NAME = 'auth';

module.exports = function (browser, config, logger, moduleLoader, statisticCollector) {
  // publish configs on protractor's browser object
  browser.testrunner = {
    config: config
  };

  // expose navigation helpers to tests
  browser.testrunner.navigation = {
    to: function (url, authConfig) {
      var auth;
      if (_.isPlainObject(_.get(authConfig, AUTH_CONFIG_NAME)) && !_.isEmpty(authConfig[AUTH_CONFIG_NAME])) {
        // use configured authentication
        auth = authConfig;
      } else {
        // use default plain authentication
        auth = AUTH_CONFIG_NAME;
      }

      var authenticator =  moduleLoader.loadNamedModule(auth, [statisticCollector]);

      // open page and login
      browser.controlFlow().execute(function () {
        logger.info('Opening: ' + url);
      });
      authenticator.get(url);

      // handle pageLoading options
      if (config.pageLoading) {

        // reload the page immediately if required
        if (config.pageLoading.initialReload) {
          browser.controlFlow().execute(function () {
            logger.debug('Initial page reload requested');
          });
          browser.driver.navigate().refresh();
        }

        // wait some time after page is loaded
        if (config.pageLoading.wait) {
          var wait = config.pageLoading.wait;
          if (_.isString(wait)) {
            wait = parseInt(wait, 10);
          }

          browser.controlFlow().execute(function () {
            logger.debug('Initial page load wait: ' + wait + 'ms');
          });
          browser.sleep(wait);
        }
      }

      // load waitForUI5 logic on client and
      // ensure app is fully loaded before starting the interactions
      browser.loadUI5Dependencies();

      // log UI5 version
      return browser.executeScriptWithDescription(clientsidescripts.getUI5Version, 'browser.getUI5Version').then(function (versionInfo) {
        logger.info('UI5 Version: ' + versionInfo.version);
        logger.info('UI5 Timestamp: ' + versionInfo.buildTimestamp);
      });
    },

    waitForRedirect: function(targetUrl){
      // ensure page is fully loaded - wait for window.url to become the same as requested
      return browser.driver.wait(function () {
        return browser.driver.executeScript(function () {
          return window.location.href;
        }).then(function (currentUrl) {
          logger.debug('Waiting for redirect to complete, current url: ' + currentUrl);

          // match only host/port/path as app could manipulate request args and fragment
          var currentUrlMathes = currentUrl.match(/([^\?\#]+)/);
          if (currentUrlMathes == null || !currentUrlMathes[1] || currentUrlMathes[1] == '') {
            throw new Error('Could not parse current url: ' + currentUrl);
          }
          var currentUrlHost = currentUrlMathes[1];
          // strip trailing slashe
          if(currentUrlHost.charAt(currentUrlHost.length - 1) == '/') {
            currentUrlHost = currentUrlHost.slice(0, -1);
          }
          // handle string and regexps
          if (_.isString(targetUrl)) {
            var targetUrlMatches = targetUrl.match(/([^\?\#]+)/);
            if (targetUrlMatches == null || !targetUrlMatches[1] || targetUrlMatches[1] == '') {
              throw new Error('Could not parse target url: ' + targetUrl);
            }
            var targetUrlHost = targetUrlMatches[1];
            // strip trailing slash
            if(targetUrlHost.charAt(targetUrlHost.length - 1) == '/') {
              targetUrlHost = targetUrlHost.slice(0, -1);
            }
            return  currentUrlHost === targetUrlHost;
          } else if (_.isRegExp(targetUrl)) {
            return targetUrl.test(currentUrlHost);
          } else {
            throw new Error('Could not match target url that is neither string nor regexp');
          }
        });
      }, browser.getPageTimeout - 100,'Waiting for redirection to complete, target url: ' + targetUrl); 
      // 10ms delta is necessary or webdriver crashes and the process stops without exit status
    }
  };

  // set meta data
  browser.testrunner.currentSuite = {
    set meta(value) {
      beforeAll(function(){
        browser.controlFlow().execute(function () {
          browser.testrunner.currentSuite._meta = value;
        });
      });
    },
    get meta() {
      return  {
        set controlName(value){
          browser.testrunner.currentSuite.meta = {controlName: value};
        }
      };
    }
  };
  browser.testrunner.currentSpec = {
    set meta(value) {
      browser.controlFlow().execute(function () {
        browser.testrunner.currentSpec._meta = value;
      });
    },
    get meta() {
      return  browser.testrunner.currentSpec._meta;
    }
  };

};
