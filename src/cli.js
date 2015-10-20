'use strict';

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
    describe('timeouts', 'Timeouts').
    string('config').
    describe('config', 'JSON formatted config object to override config file options').
    count('verbose').
    alias('v', 'verbose').
    describe('verbose', 'Print debug logs').
    string('specs').
    describe('specs', 'Specs to execute, blob pattern used by localSpecResolver only').
    //string('take').
    boolean('take').default('take',undefined).
    //alias('t','take').
    describe('take', 'Take screenshots, default: true').
    //string('compare').
    boolean('compare').default('compare',undefined).
    //alias('c','compare').
    describe('compare', 'Compare actual to reference screenshots, default: true').
    //string('update').
    boolean('update').default('update',undefined).
    //alias('u','update').
    describe('update', 'Update reference screenshots with actual screenshots if differ, default false').
    strict().
    argv;
    //TODO profile argument
    //TODO params

var cliParser = require('./cliParser')();
var config = cliParser.parse(argv);

// run the visualtest
require('./visualtest').run(config);
