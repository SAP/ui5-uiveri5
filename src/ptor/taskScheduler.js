'use strict';

var ConfigParser = require('./configParser').ConfigParser;

/**
 * properties for parallelization and multi browser support:
 * as taken from https://github.com/angular/protractor/blob/master/lib/config.ts
 * - count - Number of times to run this set of capabilities (in parallel, unless limited by maxSessions). Default is 1.
 * - shardTestFiles - If this is set to be true, specs will be sharded by file
 *   (i.e. all files to be run by this set of capabilities will run in parallel). Default is false.
 * - maxInstances - Maximum number of browser instances that can run in parallel for this set of capabilities.
 *   This is only needed if shardTestFiles is true. Default is <total-number-of-spec-files> in UIVeri5 (and 1 in protractor).
 * - maxSessions - Maximum number of total browser sessions to run.
 *   Tests are queued in sequence if number of browser sessions is limited by this parameter.
 *   Use a number less than 1 to denote unlimited. Default is unlimited.
 */

/**
 * The taskScheduler keeps track of the spec files that needs to run next
 * and which task is running what.
 */
function TaskQueue(capabilities, specLists) {
  // A queue of specs for a particular capacity
  this.capabilities = capabilities;
  this.specLists = specLists;
  this.numRunningInstances = 0;
  this.specsIndex = 0;
  this.maxInstance = capabilities.maxInstances || 1;
}

/**
 * A scheduler to keep track of specs that need running and their associated
 * capabilities. It will suggest a task (combination of capabilities and spec)
 * to run while observing the following config rules:
 * multiCapabilities, shardTestFiles, and maxInstance.
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

  var taskQueues = [];
  config.multiCapabilities.forEach((capabilities) => {
    var capabilitiesSpecs = allSpecs;
    if (capabilities.specs) {
      var capabilitiesSpecificSpecs = ConfigParser.resolveFilePatterns(capabilities.specs, false, config.configDir);
      capabilitiesSpecs = capabilitiesSpecs.concat(capabilitiesSpecificSpecs);
    }
    if (capabilities.exclude) {
      var capabilitiesSpecExcludes = ConfigParser.resolveFilePatterns(capabilities.exclude, true, config.configDir);
      capabilitiesSpecs = capabilitiesSpecs.filter((path) => {
        return capabilitiesSpecExcludes.indexOf(path) < 0;
      });
    }
    var specLists = [];
    // If we shard, we return an array of one element arrays, each containing
    // the spec file. If we don't shard, we return an one element array
    // containing an array of all the spec files

    if (capabilities.shardTestFiles) {
      capabilitiesSpecs.forEach((spec) => {
        specLists.push([spec]);
      });

      // always allow to run the maximum number of browsers in parallel
      capabilities.maxInstances = capabilities.maxInstances || config.specs.length;
    } else {
      specLists.push(capabilitiesSpecs);
    }

    capabilities.count = capabilities.count || 1;
    for (var i = 0; i < capabilities.count; ++i) {
      taskQueues.push(new TaskQueue(capabilities, specLists));
    }
  });
  this.taskQueues = taskQueues;
  this.rotationIndex = 0; // Helps suggestions to rotate amongst capabilities
}

/**
 * Get the next task that is allowed to run without going over maxInstance.
 *
 * @return {{capabilities: Object, specs: Array.<string>, taskId: string,
 * done: function()}}
 */
TaskScheduler.prototype.nextTask = function () {
  for (var i = 0; i < this.taskQueues.length; ++i) {
    var rotatedIndex = ((i + this.rotationIndex) % this.taskQueues.length);
    var queue = this.taskQueues[rotatedIndex];
    if (queue.numRunningInstances < queue.maxInstance && queue.specsIndex < queue.specLists.length) {
      this.rotationIndex = rotatedIndex + 1;
      ++queue.numRunningInstances;
      var taskId = '' + rotatedIndex + 1;
      if (queue.specLists.length > 1) {
        taskId += '-' + queue.specsIndex;
      }
      var specs = queue.specLists[queue.specsIndex];
      ++queue.specsIndex;
      return {
        capabilities: queue.capabilities,
        specs: specs,
        taskId: taskId,
        done: function () {
          --queue.numRunningInstances;
        }
      };
    }
  }
  return null;
};

/**
 * Get the number of tasks left to run or are currently running.
 *
 * @return {number}
 */
TaskScheduler.prototype.numTasksOutstanding = function () {
  var count = 0;
  this.taskQueues.forEach((queue) => {
    count += queue.numRunningInstances + (queue.specLists.length - queue.specsIndex);
  });
  return count;
};

/**
 * Get maximum number of concurrent tasks required/permitted.
 *
 * @return {number}
 */
TaskScheduler.prototype.maxConcurrentTasks = function () {
  if (this.config.maxSessions && this.config.maxSessions > 0) {
    return this.config.maxSessions;
  }
  else {
    var count = 0;
    this.taskQueues.forEach((queue) => {
      count += Math.min(queue.maxInstance, queue.specLists.length);
    });
    return count;
  }
};

/**
 * Returns number of tasks currently running.
 *
 * @return {number}
 */
TaskScheduler.prototype.countActiveTasks = function () {
  var count = 0;
  this.taskQueues.forEach((queue) => {
    count += queue.numRunningInstances;
  });
  return count;
};

module.exports = {
  TaskQueue: TaskQueue,
  TaskScheduler: TaskScheduler
};
