var url = require('url');
var logger = require('../logger');

module.exports = function (config, storageProvider) {
  // finds a UIVeri5 spec definition by a given Jasmine suite description
  // i.e. given the description of one of the suites in a spec file, find the information for that file.
  function _getSpecDetails(suite) {
    return config.specsWithDetails.filter(function (suiteDetails) {
      return suiteDetails.fullName === suite.description;
    })[0];
  }

  return {
    register: function () {
      jasmine.getEnv().addReporter({

        jasmineStarted: function () {
          // call storage provider beforeAll hook
          if (storageProvider && storageProvider.onBeforeAllSpecs) {
            storageProvider.onBeforeAllSpecs(config.specsWithDetails);
          }
        },

        // open test content page before every suite
        // TODO consider several describe() per spec file
        suiteStarted: function (result) {
          var spec = _getSpecDetails(result);
          var contentUrl = spec ? spec.contentUrl : config.baseUrl;
          // open content pag e if required
          if (!contentUrl) {
            logger.debug('Skip content page opening');
            return;
          }

          // webdriverjs operations are inherently synchronized by webdriver flow
          // so no need to synchronize manually with callbacks/promises

          // add request params
          var specUrl = url.parse(contentUrl);
          if (config.baseUrlQuery && config.baseUrlQuery.length > 0) {
            if (specUrl.search == null) {
              specUrl.search = '';
            }
            config.baseUrlQuery.forEach(function (value, index) {
              if (index > 0) {
                specUrl.search += '&';
              }
              specUrl.search += value;
            });
          }

          // open test page
          var specUrlString = url.format(specUrl);
          // enclose all WebDriver operations in a new flow for a gracefull handling of failures
          // will call jasmine.fail() that will handle the error
          browser.controlFlow().execute(function () {
            browser.testrunner.navigation.to(specUrlString).then(function () {
              // call storage provider beforeEach hook
              if (storageProvider && storageProvider.onBeforeEachSpec) {
                storageProvider.onBeforeEachSpec(spec);
              }
            });
          }).catch(function (error) {
            // the failure in reporter -> beforeAll will not stop further suite execution !
            // fail-fast was discussed here -> https://github.com/jasmine/jasmine/issues/778
            // stop the suite will require jasmin 3.0 -> https://github.com/jasmine/jasmine/issues/414
            // stop the spec when error require jasmin 2.4 -> https://jasmine.github.io/2.4/node.html#section-13
            // completing of this functionality in jasmine 2.8 -> https://github.com/jasmine/jasmine/issues/577
            // In jasmine 2.3 a throwOnExpectationFailure(true) was added -> https://stackoverflow.com/questions/22119193/stop-jasmine-test-after-first-expect-fails
            // it does not make sense for us at it simply throws error from the first failed expectation and this kills the whole execution
            fail(error);
          });
        },

        suiteDone: function (result) {
          var spec = _getSpecDetails(result);
          // call storage provider afterEach hook
          if (spec && storageProvider && storageProvider.onAfterEachSpec) {
            storageProvider.onAfterEachSpec(spec);
          }
        },

        jasmineDone: function () {
          // call storage provider afterAll hook
          if (storageProvider && storageProvider.onAfterAllSpecs) {
            storageProvider.onAfterAllSpecs(config.specsWithDetails);
          }
        }
      });
    }
  };
};
