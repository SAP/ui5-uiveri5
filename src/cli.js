'use strict';

var _ = require('lodash');

var argv = require('optimist').
    usage('Usage: visualtest [options]').
    describe('libs', 'Comma separated list of lib suites to execute, defaults to all').
    describe('specs', 'Comma separated list of specs to execute, defaults to all').
    //describe('browsers', ''Comma separated list of browsers to execute tests, defaults to chrome').
    //describe('seleniumAddress', 'A running selenium address to use, defaults to localhost').
    //describe('seleniumPort', 'Optional port for the selenium standalone server', defaults to 4444).
    describe('verbose', 'Print debug logs').
    argv;

// copy argv properties, no func, no prototype
var config = {};
for (var name in argv) {
  if (_.has(argv,name) && !_.isFunction(name) && !name.indexOf('$0')==0 && name!=='_') {
    config[name] = argv[name];
  }
}

// pass provided *.conf.js file
config.conf = argv._[0];

// run the visualtest
require('./visualtest').run(config);
