'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var argv = require('optimist').
    usage('Usage: visualtest [options] [confFile]\n' +
          'confFile defaults to conf.js if presented in current working directory.').
    describe('libFilter', 'Comma separated list of lib suites to execute, defaults to all').
    describe('specFilter', 'Comma separated list of specs to execute, defaults to all').
    describe('specs', 'Specs to execute').
    describe('baseUrl', 'Base url to execute the spec against, defaults to http://localhost:8080').
    //describe('browsers', ''Comma separated list of browsers to execute tests, defaults to chrome').
    //describe('seleniumAddress', 'A running selenium address to use, defaults to localhost').
    //describe('seleniumPort', 'Optional port for the selenium standalone server', defaults to 4444).
    describe('verbose', 'Print debug logs').
    argv;

// copy argv properties, no func, no prototype, no special members
var config = {};
for (var name in argv) {
  if (_.has(argv,name) && !_.isFunction(name) && !name.indexOf('$0')==0 && name!=='_') {
    config[name] = argv[name];
  }
}

// pass provided *.conf.js file
config.conf = argv._[0];

// conf file is not provided on command line => try loading conf.js from current dir
if (!config.conf) {
  var resolvedLocalConf = path.resolve('./conf.js');
  if (fs.existsSync(resolvedLocalConf)) {
    config.conf = resolvedLocalConf;
  }
}

// run the visualtest
require('./visualtest').run(config);
