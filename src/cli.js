'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var argv = require('yargs').
    usage('Usage: visualtest [options] [confFile]\n' +
          'confFile defaults to conf.js if presented in current working directory.').
    string('libFilter').
    describe('libFilter', 'Comma separated list of lib suites to execute, defaults to all').
    string('specFilter').
    describe('specFilter', 'Comma separated list of specs to execute, defaults to all').
    string('baseUrl').
    describe('baseUrl', 'Base url to execute the spec against, defaults to http://localhost:8080').
    string('seleniumAddress').
    describe('seleniumAddress','Address of remote Selenium server, if missing will start local selenium server').
    string('browsers').
    describe('browsers', 'Comma separated list of browsers to execute tests, defaults to chrome').
    describe('params', 'Param object to be passed to the tests').
    count('verbose').
    alias('v', 'verbose').
    describe('verbose', 'Print debug logs').
    string('specs').
    describe('specs', 'Specs to execute, blob pattern used by localSpecResolver only').
    strict().
    argv;
    //TODO profile argument
    //TODO params

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
  var localConf = './conf.js';
  if (fs.existsSync(localConf)) {
    config.conf = localConf;
  }
}

// current dir conf is resolved against cwd()
if (config.conf){
  config.conf = path.resolve(config.conf);
}

// TODO research how dot notation works with duplicates ?
// resolve browsers argument
if (config.browsers){
  if(_.isString(config.browsers)){
    var browsers = config.browsers.split(',');
    // TODO capabilities from command line -> consider more extensive parsing - ':' notation or full json
    config.browsers = [];
    browsers.forEach(function(browser){
      config.browsers.push({
        browserName: browser
      });
    });
  }
}

// run the visualtest
require('./visualtest').run(config);
