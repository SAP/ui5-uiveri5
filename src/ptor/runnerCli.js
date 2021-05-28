/**
 * This serves as the main function for starting a test run that has been requested by the launcher.
 */
var ConfigParser = require('./configParser').ConfigParser;
var logger = require('../logger');
var Runner = require('./runner').Runner;

process.on('message', (message) => {
  switch (message.command) {
  case 'run':
    if (!message.capabilities) {
      throw new Error('Run message missing capabilities');
    }
    // Merge in config file options.
    var configParser = new ConfigParser();
    if (message.additionalConfig) {
      configParser.addConfig(message.additionalConfig);
    }
    var config = configParser.getConfig();
    // Grab capabilities to run from launcher.
    config.capabilities = message.capabilities;
    // Get specs to be executed by this runner
    config.specs = message.specs;

    // Launch test run.
    var runner = new Runner(config);
    // Pipe events back to the launcher.
    runner.on('testPass', () => {
      process.send({ event: 'testPass' });
    });
    runner.on('testFail', () => {
      process.send({ event: 'testFail' });
    });
    runner.on('testsDone', (results) => {
      process.send({ event: 'testsDone', results: results });
    });
    runner.run()
      .then((exitCode) => {
        process.exit(exitCode);
      })
      .catch((err) => {
        logger.info(err.message);
        process.exit(1);
      });
    break;
  default:
    throw new Error('command ' + message.command + ' is invalid');
  }
});
