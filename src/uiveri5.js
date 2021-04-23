/**
 * uses modules copied from protractor@5.3.2
 */

var _ = require('lodash');
var path = require('path');
var logger = require('./logger');
var utils = require('./configUtils');

/**
 * @typedef Config
 * @type {Object}
 * @property {String} specResolver - spec resolver to use, defaults to: localSpecResolver for profile
 *  integration and localUI5SpecResolver for profile visual
 * @property {String} conf - config file to use, defaults to: '../conf/default.conf.js'
 *  that contains only: profile: 'visual'
 * @property {String} profile - used to resolve profile config file with pattern: '../conf/<profile>.conf.js,
 *  no profile resolved if undefined, defaults to: visual if default.conf.js loaded
 * @property {number} verbose - verbose level, 0 shows only info, 1 shows debug,
 *  2 shows waitForUI5 executions,3 shows also waitForUI5 script content, defaults t: 0
 * @property {<BrowserCapability|String}>[]} browsers - list of browsers to drive. Single word is assumed to
 *  be browserName, supports column delimited and json formats, overwrites *.conf.js values, defaults to: 'chrome'
 * @property {Object} params - params object to be passed to the tests
 */

/**
 * Runs e2e tests
 * @param {Config} config - configs
 * @return {Promise} resolved on success or rejected with error 
 */
function run(config) {

  logger.setLevel(config.verbose);

  utils.logFrameworkVersion();

  logger.debug('Config from command-line: ' + JSON.stringify({ config: config }));

  // merge in config files
  var configParser = require('./configParser')(logger);
  config = configParser.mergeConfigs(config);

  config.osTypeString = utils.getOSType();

  var moduleLoader = require('./moduleLoader')(config);

  // resolve runtime and set browsers with capabilities
  var runtimeResolver = require('./runtimeResolver')(config, logger);
  config.runtimes = runtimeResolver.resolveRuntimes();

  // resolve browsers capabilities from runtime
  var runtimeCapabilitiesResolver = require('./runtimeCapabilitiesResolver')();
  var multiCapabilities = config.runtimes.map(function (runtime) {
    // prepare capabilities from runtime for this specific connection type
    return runtimeCapabilitiesResolver.resolveCapabilitiesFromRuntime(runtime);
  });
  logger.debug('Resolved multiCapabilities: ' + JSON.stringify({ multiCapabilities: multiCapabilities }));

  // resolve all placeholders in config
  configParser.resolvePlaceholders(config);

  // update logger with resolved configs
  logger.setLevel(config.verbose);

  // log config object so far
  logger.debug('Config after resolving config file and profile: ' + JSON.stringify({ config: config }));

  logger.debug('Current working directory: ' + process.cwd());

  // load spec resolver
  var specResolver = moduleLoader.loadModule('specResolver');

  // resolve specs.
  // specs refers to the collection of found .spec.js files (a file containing Jasmine suites)
  logger.info('Resolving specs');
  return specResolver.resolve().then(function (specs) {
    if (!specs || specs.length == 0) {
      throw Error('No specs found');
    }

    var launcherArgv = _.extend(config, {
      specs: _.map(specs, 'testPath'),
      specsWithDetails: specs,
      multiCapabilities: multiCapabilities,
      // require direct connection as directDriverProvider will be overtaken later
      directConnect: true,
      troubleshoot: config.verbose > 0,
      baseUrl: config.baseUrl,
      // use jasmine 2.0
      framework: 'jasmine2',
      jasmineNodeOpts: {
        // disable default jasmine console reporter
        print: function () { }
      },
      // onPrepare is executed after test env setup and just before test execution starts (possibly in child process)
      // use filename relative to launcher - instead of function, to support multi browser
      onPrepare: path.join(__dirname, './testPreparer')
    });

    utils.copyTimeouts(launcherArgv, config);

    logger.info('Executing ' + specs.length + ' specs');

    var launcher = require('./ptor/launcher');
    return launcher.init(launcherArgv);
  });
}

exports.run = run;
