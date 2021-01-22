'use strict';

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var firefox = require('selenium-webdriver/firefox');
var http = require('selenium-webdriver/http');
var remote = require('selenium-webdriver/remote');
var command = require('selenium-webdriver/lib/command');

var browser = require('../browser/browser');
var element = require('../element/element');
var locators = require('../element/locators');
var expectedConditions = require('../element/expectedConditions');

function Ptor() {
  // $ and $$ will be available after driver starts
  this.$ = function (search) {
    return null;
  };
  this.$$ = function (search) {
    return null;
  };
  // Export protractor classes.
  this.ProtractorBrowser = browser.ProtractorBrowser;
  this.ElementFinder = element.ElementFinder;
  this.ElementArrayFinder = element.ElementArrayFinder;
  this.ProtractorBy = locators.ProtractorBy;
  this.ProtractorExpectedConditions = expectedConditions.ProtractorExpectedConditions;
  // Export selenium webdriver.
  this.ActionSequence = webdriver.ActionSequence;
  this.Browser = webdriver.Browser;
  this.Builder = webdriver.Builder;
  this.Button = webdriver.Button;
  this.Capabilities = webdriver.Capabilities;
  this.Capability = webdriver.Capability;
  this.EventEmitter = webdriver.EventEmitter;
  this.FileDetector = webdriver.FileDetector;
  this.Key = webdriver.Key;
  this.Session = webdriver.Session;
  this.WebDriver = webdriver.WebDriver;
  this.WebElement = webdriver.WebElement;
  this.WebElementPromise = webdriver.WebElementPromise;
  this.error = webdriver.error;
  this.logging = webdriver.logging;
  this.promise = webdriver.promise;
  this.until = webdriver.until;
  this.Command = command.Command;
  this.CommandName = command.Name;
  this.utils = {
    firefox: firefox,
    http: http,
    remote: remote,
    chrome: chrome
  };
}

module.exports = {
  Ptor: Ptor,
  protractor: new Ptor()
};
