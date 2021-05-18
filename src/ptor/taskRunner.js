'use strict';

var child_process = require('child_process');
var events = require('events');
var q = require('q');
var logger = require('../logger');

var ConfigParser = require('./configParser').ConfigParser;
var TaskLogger = require('./taskLogger').TaskLogger;
var Runner = require('./runner').Runner;

/**
 * A runner for running a specified task (capabilities + specs).
 * The TaskRunner can either run the task from the current process (via './runner.js')
 * or from a new process (via './runnerCli.js').
 *
 * @constructor
 * @param {object} additionalConfig Additional configuration.
 * @param {object} task Task to run.
 * @param {boolean} runInFork Whether to run test in a forked process.
 * @constructor
 */
function TaskRunner (additionalConfig, task, runInFork) {
  events.EventEmitter.apply(this, arguments);
  this.additionalConfig = additionalConfig;
  this.task = task;
  this.runInFork = runInFork;
}

TaskRunner.prototype = Object.assign({}, events.EventEmitter.prototype);
TaskRunner.prototype.constructor = TaskRunner;

/**
 * Sends the run command.
 * @return {q.Promise} A promise that will resolve when the task finishes
 *     running. The promise contains the following parameters representing the
 *     result of the run:
 *       taskId, specs, capabilities, failedCount, exitCode, specResults
 */
TaskRunner.prototype.run = function () {

  var runResults = {
    taskId: this.task.taskId,
    specs: this.task.specs,
    capabilities: this.task.capabilities,
    // The following are populated while running the test:
    failedCount: 0,
    exitCode: -1,
    specResults: []
  };
  var configParser = new ConfigParser();

  if (this.additionalConfig) {
    configParser.addConfig(this.additionalConfig);
  }
  var config = configParser.getConfig();
  config.capabilities = this.task.capabilities;
  config.specs = this.task.specs;

  if (this.runInFork) {
    logger.debug('Running multiple browsers in child processes');
    var deferred = q.defer();
    var childProcess = child_process.fork(__dirname + '/runnerCli.js', process.argv.slice(2), {
      cwd: process.cwd(),
      silent: true
    });
    var taskLogger = new TaskLogger(this.task, childProcess.pid);
    // stdout pipe
    childProcess.stdout.on('data', (data) => {
      taskLogger.log(data);
    });
    // stderr pipe
    childProcess.stderr.on('data', (data) => {
      taskLogger.log(data);
    });
    childProcess
      .on('message', (message) => {
        if (config.verboseMultiSessions) {
          taskLogger.peek();
        }
        switch (message.event) {
        case 'testPass':
          process.stdout.write('.');
          break;
        case 'testFail':
          process.stdout.write('F');
          break;
        case 'testsDone':
          runResults.failedCount = message.results.failedCount;
          runResults.specResults = message.results.specResults;
          break;
        }
      })
      .on('error', (err) => {
        taskLogger.flush();
        deferred.reject(err);
      })
      .on('exit', (code) => {
        taskLogger.flush();
        runResults.exitCode = code;
        deferred.resolve(runResults);
      });

    childProcess.send({
      command: 'run',
      additionalConfig: this.additionalConfig,
      capabilities: this.task.capabilities,
      specs: this.task.specs
    });

    return deferred.promise;
  } else {
    logger.debug('Running one browser in the current process');
    var runner = new Runner(config);
    runner.on('testsDone', (results) => {
      runResults.failedCount = results.failedCount;
      runResults.specResults = results.specResults;
    });
    return runner.run().then((exitCode) => {
      runResults.exitCode = exitCode;
      return runResults;
    });
  }
};

module.exports.TaskRunner = TaskRunner;
