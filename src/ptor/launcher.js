'use strict';

/**
 * The launcher is responsible for parsing the capabilities from the
 * input configuration and launching test runners.
 */
var fs = require('fs');
var q = require('q');
var ConfigParser = require('./configParser').ConfigParser;
var exitCodes = require('./exitCodes');
var TaskScheduler = require('./taskScheduler').TaskScheduler;

var logger = require('../logger');
var helper = require('./util');
var Runner = require('./runner').Runner;
var TaskRunner = require('./taskRunner').TaskRunner;

var RUNNERS_FAILED_EXIT_CODE = 100;

/**
 * Keeps track of a list of task results. Provides method to add a new
 * result, aggregate the results into a summary, count failures,
 * and save results into a JSON file.
 */
function TaskResults() {
  this.results_ = [];
}
 
TaskResults.prototype.add = function (result) {
  this.results_.push(result);
};

TaskResults.prototype.totalSpecFailures = function () {
  return this.results_.reduce((specFailures, result) => {
    return specFailures + result.failedCount;
  }, 0);
};

TaskResults.prototype.totalProcessFailures = function () {
  return this.results_.reduce((processFailures, result) => {
    return !result.failedCount && result.exitCode !== 0 ? processFailures + 1 : processFailures;
  }, 0);
};

TaskResults.prototype.saveResults = function (filepath) {
  var jsonOutput = this.results_.reduce((jsonOutput, result) => {
    return jsonOutput.concat(result.specResults);
  }, []);
  var json = JSON.stringify(jsonOutput, null, '  ');
  fs.writeFileSync(filepath, json);
};

TaskResults.prototype.reportSummary = function () {
  var specFailures = this.totalSpecFailures();
  var processFailures = this.totalProcessFailures();
  this.results_.forEach((result) => {
    var capabilities = result.capabilities;
    var shortName = (capabilities.browserName) ? capabilities.browserName : '';
    shortName = (capabilities.logName) ?
      capabilities.logName :
      (capabilities.browserName) ? capabilities.browserName : '';
    shortName += (capabilities.version) ? capabilities.version : '';
    shortName += (capabilities.logName && capabilities.count < 2) ? '' : ' #' + result.taskId;
    if (result.failedCount) {
      logger.info(shortName + ' failed ' + result.failedCount + ' test(s)');
    }
    else if (result.exitCode !== 0) {
      logger.info(shortName + ' failed with exit code: ' + result.exitCode);
    }
    else {
      logger.info(shortName + ' passed');
    }
  });
  if (specFailures && processFailures) {
    logger.info('overall: ' + specFailures + ' failed spec(s) and ' + processFailures +
      ' process(es) failed to complete');
  }
  else if (specFailures) {
    logger.info('overall: ' + specFailures + ' failed spec(s)');
  }
  else if (processFailures) {
    logger.info('overall: ' + processFailures + ' process(es) failed to complete');
  }
};

var taskResults_ = new TaskResults();

/**
 * Initialize and run the tests.
 * Exits with 1 on test failure, and RUNNERS_FAILED_EXIT_CODE on unexpected
 * failures.
 *
 * @param {Object=} config
 */
var init = function (config, connectionProvider, plugins) {
  var configParser = new ConfigParser();
  configParser.addConfig(config);
  var config = configParser.getConfig();
 
  logger.debug('Your base url for tests is ' + config.baseUrl);
  // Run beforeLaunch
  helper.runFilenameOrFn_(config.configDir, config.beforeLaunch)
    .then(() => {
      return q
        .Promise((resolve, reject) => {
          // 1) If getMultiCapabilities is set, resolve that as
          // `multiCapabilities`.
          if (config.getMultiCapabilities &&
            typeof config.getMultiCapabilities === 'function') {
            if (config.multiCapabilities.length || config.capabilities) {
              logger.info('getMultiCapabilities() will override both capabilities ' +
                'and multiCapabilities');
            }
            // If getMultiCapabilities is defined and a function, use this.
            q(config.getMultiCapabilities())
              .then((multiCapabilities) => {
                config.multiCapabilities = multiCapabilities;
                config.capabilities = null;
              })
              .then(() => {
                resolve();
              })
              .catch(err => {
                reject(err);
              });
          }
          else {
            resolve();
          }
        })
        .then(() => {
          // 2) Set `multicapabilities` using `capabilities`,
          // `multicapabilities`,
          // or default
          if (config.capabilities) {
            if (config.multiCapabilities.length) {
              logger.info('You have specified both capabilities and ' +
                'multiCapabilities. This will result in capabilities being ' +
                'ignored');
            }
            else {
              // Use capabilities if multiCapabilities is empty.
              config.multiCapabilities = [config.capabilities];
            }
          }
          else if (!config.multiCapabilities.length) {
            // Default to chrome if no capabilities given
            config.multiCapabilities = [{ browserName: 'chrome' }];
          }
        });
    })
    .then(() => {
      // 3) If we're in `elementExplorer` mode, run only that.
      if (config.elementExplorer || config.framework === 'explorer') {
        if (config.multiCapabilities.length != 1) {
          throw new Error('Must specify only 1 browser while using elementExplorer');
        }
        else {
          config.capabilities = config.multiCapabilities[0];
        }
        config.framework = 'explorer';
        var runner = new Runner(config, connectionProvider, plugins);
        return runner.run().then((exitCode) => {
          process.exit(exitCode);
        }, (err) => {
          logger.error(err);
          process.exit(1);
        });
      }
    })
    .then(() => {
      // 4) Run tests.
      var scheduler = new TaskScheduler(config);
      process.on('uncaughtException', (exc) => {
        var e = (exc instanceof Error) ? exc : new Error(exc);
        if (config.ignoreUncaughtExceptions) {
          // This can be a sign of a bug in the test framework, that it may
          // not be handling WebDriver errors properly. However, we don't
          // want these errors to prevent running the tests.
          logger.info('Ignoring uncaught error ' + exc);
          return;
        }
        var errorCode = exitCodes.ErrorHandler.parseError(e);
        if (errorCode) {
          var protractorError = e;
          exitCodes.ProtractorError.log(logger, errorCode, protractorError.message, protractorError.stack);
          process.exit(errorCode);
        }
        else {
          logger.error(e.message);
          logger.error(e.stack);
          process.exit(exitCodes.ProtractorError.CODE);
        }
      });
      process.on('exit', (code) => {
        if (code) {
          logger.error('Process exited with error code ' + code);
        }
        else if (scheduler.numTasksOutstanding() > 0) {
          logger.error('BUG: launcher exited with ' + scheduler.numTasksOutstanding() +
            ' tasks remaining');
          process.exit(RUNNERS_FAILED_EXIT_CODE);
        }
      });
      // Run afterlaunch and exit
      var cleanUpAndExit = (exitCode) => {
        return helper.runFilenameOrFn_(config.configDir, config.afterLaunch, [exitCode])
          .then((returned) => {
            if (typeof returned === 'number') {
              process.exit(returned);
            }
            else {
              process.exit(exitCode);
            }
          }, (err) => {
            logger.error('Error:', err);
            process.exit(1);
          });
      };
      var totalTasks = scheduler.numTasksOutstanding();
      var forkProcess = false;
      if (totalTasks > 1) {
        forkProcess = true;
        if (config.debug) {
          throw new exitCodes.ConfigError(logger, 'Cannot run in debug mode with multiCapabilities, count > 1, or sharding');
        }
      }
      var deferred = q.defer(); // Resolved when all tasks are completed
      var createNextTaskRunner = () => {
        var task = scheduler.nextTask();
        if (task) {
          var taskRunner = new TaskRunner(config, task, forkProcess, connectionProvider, plugins);
          taskRunner.run()
            .then((result) => {
              if (result.exitCode && !result.failedCount) {
                logger.error('Runner process exited unexpectedly with error code: ' + result.exitCode);
              }
              taskResults_.add(result);
              task.done();
              createNextTaskRunner();
              // If all tasks are finished
              if (scheduler.numTasksOutstanding() === 0) {
                deferred.resolve();
              }
              logger.info(scheduler.countActiveTasks() + ' instance(s) of WebDriver still running');
            })
            .catch((err) => {
              logger.error('Error:', err.stack || err.message || err);
              cleanUpAndExit(RUNNERS_FAILED_EXIT_CODE);
            });
        }
      };
      // Start `scheduler.maxConcurrentTasks()` workers for handling tasks in
      // the beginning. As a worker finishes a task, it will pick up the next
      // task
      // from the scheduler's queue until all tasks are gone.
      for (var i = 0; i < scheduler.maxConcurrentTasks(); ++i) {
        createNextTaskRunner();
      }
      logger.info('Running ' + scheduler.countActiveTasks() + ' instances of WebDriver');
      // By now all runners have completed.
      deferred.promise
        .then(function () {
          // Save results if desired
          if (config.resultJsonOutputFile) {
            taskResults_.saveResults(config.resultJsonOutputFile);
          }
          taskResults_.reportSummary();
          var exitCode = 0;
          if (taskResults_.totalProcessFailures() > 0) {
            exitCode = RUNNERS_FAILED_EXIT_CODE;
          }
          else if (taskResults_.totalSpecFailures() > 0) {
            exitCode = 1;
          }
          return cleanUpAndExit(exitCode);
        })
        .done();
    })
    .done();
};

module.exports.init = init;
