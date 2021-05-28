var path = require('path');
var ConfigParser = require('./configParser').ConfigParser;

var TEMP_JSON_REPORT_NAME = path.join(process.cwd(), 'temp.json');

/**
 * The taskScheduler keeps track of the spec files that needs to run next and which task is running what.
 * Supports only 1 browser in config.multiCapabilities - config.multiCapabilities[0]. Others are ignored.
 * TODO: refactor runtime resolver to use capabilities instead of multiCapabilities
 *
 */
function TaskQueue(capabilities, specLists) {
  // A queue of specs for a particular capacity
  this.capabilities = capabilities;
  this.specLists = specLists;
  this.numRunningInstances = 0;
  this.specsIndex = 0;
}

/**
 * A scheduler to keep track of specs that need running and their associated
 * capabilities. It will suggest a task (combination of capabilities and spec)
 * to run while observing the multiCapabilities and global config.
 * Precondition: multiCapabilities is a non-empty array
 * (capabilities and getCapabilities will both be ignored)
 *
 * @constructor
 * @param {Object} config parsed from the config file
 */
function TaskScheduler(config) {
  this.config = config;
  var excludes = ConfigParser.resolveFilePatterns(config.exclude, true, config.configDir);
  var allSpecs = ConfigParser.resolveFilePatterns(ConfigParser.getSpecs(config), false, config.configDir)
    .filter((path) => {
      return excludes.indexOf(path) < 0;
    });

  var capabilities = config.multiCapabilities[0]; // ignore other browsers

  // Maximum number of browser instances that can run in parallel. Each instance will run a single spec file.
  // If number of tests > maxInstances, new instances will be created when another one completes. Default is 1.
  config.maxInstances = config.maxInstances || 1;

  var runOneSpecFilePerBrowserInstance = config.restartBrowserBetweenSpecs || config.maxInstances > 1;

  var specLists = [];
  // when running multiple instances, run one spec file per instance
  // If we shard, we return an array of one element arrays, each containing the spec file.
  // If we don't shard, we return an one element array containing an array of all the spec files
  if (runOneSpecFilePerBrowserInstance) {
    config.tempJsonReport = TEMP_JSON_REPORT_NAME;
    allSpecs.forEach((spec) => {
      specLists.push([spec]);
    });
  } else {
    specLists.push(allSpecs);
  }

  this.taskQueue = new TaskQueue(capabilities, specLists);
}

/**
 * Get the next task that is allowed to run without going over maxInstances
 *
 * @return {{capabilities: Object, specs: Array.<string>, taskId: string,
 * done: function()}}
 */
TaskScheduler.prototype.nextTask = function () {
  if (this.taskQueue.numRunningInstances < this.config.maxInstances && this.taskQueue.specsIndex < this.taskQueue.specLists.length) {
    ++this.taskQueue.numRunningInstances;
    var taskId = '1';
    if (this.taskQueue.specLists.length > 1) {
      taskId += '-' + this.taskQueue.specsIndex;
    }
    var specs = this.taskQueue.specLists[this.taskQueue.specsIndex];
    ++this.taskQueue.specsIndex;
    return {
      capabilities: this.taskQueue.capabilities,
      specs: specs,
      taskId: taskId,
      done: function () {
        --this.taskQueue.numRunningInstances;
      }.bind(this)
    };
  }
  return null;
};

/**
 * Get the number of tasks left to run or are currently running.
 *
 * @return {number}
 */
TaskScheduler.prototype.numTasksOutstanding = function () {
  return this.taskQueue.numRunningInstances + (this.taskQueue.specLists.length - this.taskQueue.specsIndex);
};

/**
 * Returns number of tasks currently running.
 *
 * @return {number}
 */
TaskScheduler.prototype.countActiveTasks = function () {
  return this.taskQueue.numRunningInstances;
};

module.exports = {
  TaskQueue: TaskQueue,
  TaskScheduler: TaskScheduler
};
