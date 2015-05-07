'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var argv = require('yargs')
    .usage('Usage: visualtest [options] [confFile]\n' +
          'confFile defaults to conf.js if presented in current working directory.')
    .string('libFilter')
    .describe('libFilter', 'Comma separated list of lib suites to execute, defaults to all')
    .string('specFilter')
    .describe('specFilter', 'Comma separated list of specs to execute, defaults to all')
    .string('baseUrl')
    .describe('baseUrl', 'Base url to execute the spec against, defaults to http://localhost:8080')
    //.describe('browsers', 'Comma separated list of browsers to execute tests, defaults to chrome')
    .string('seleniumAddress')
    .describe('seleniumAddress','Address of remote Selenium server, default to http://localhost:4444/wd/hub')
    .boolean('ignoreSync')
    .alias('i', 'ignoreSync')
    .describe('ignoreSync', 'Ignore sync')
    .count('verbose')
    .alias('v', 'verbose')
    .describe('verbose', 'Print debug logs')
    .string('specs')
    .describe('specs', 'Specs to execute, blob pattern used by localSpecResolver only')
    .strict()
    .argv;

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

// run the visualtest
require('./visualtest').run(config);
