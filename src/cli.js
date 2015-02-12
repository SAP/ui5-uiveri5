'use strict';

var optimist = require('optimist').
    usage('Usage: visualtest [options]').
    describe('root', 'openUI5 project root').
    describe('libs', 'Comma separated list of lib suites to execute, defaults to all').
    describe('specs', 'Comma separated list of specs to execute, defaults to all').
    describe('baseUrl', 'A base URL for test content').
    //describe('browsers', ''Comma separated list of browsers to execute tests, defaults to chrome').
    //describe('seleniumAddress', 'A running selenium address to use, defaults to localhost').
    //describe('seleniumPort', 'Optional port for the selenium standalone server', defaults to 4444).
    describe('verbose', 'Print debug logs')
    ;
var argv = optimist.parse(process.argv);

// parse argv to config object
var config = {};
config.verbose = argv.verbose;
config.baseUrl = argv.baseUrl;

// run the visualtest
require('./visualtest').run(config);
