var _ = require('lodash');

var PageObjectFactory = function () {
  this.Given = {};
  this.When = {};
  this.Then = {};
};

PageObjectFactory.prototype.createPageObjects = function (pageObjects) {
  var that = this;

  _.each(pageObjects, function (definition, page) {
    // merge baseClass' arrangements, actions, assertions
    if (definition.baseClass && _.isObject(definition.baseClass)) {
      if (definition.baseClass.actions && _.isObject(definition.baseClass.actions)) {
        _.extend(definition.actions, definition.baseClass.actions);
      }
      if (definition.baseClass.assertions && _.isObject(definition.baseClass.assertions)) {
        _.extend(definition.assertions, definition.baseClass.assertions);
      }
      if (definition.baseClass.arrangements && _.isObject(definition.baseClass.arrangements)) {
        _.extend(that.Given, definition.baseClass.arrangements);
      }
    }

    var name = 'onThe' + page + 'Page';
    
    if (that.When[name] || that.Then[name] || that.Given[name]) {
      var config = browser.testrunner.config; // this is already available here
      var logger = require('./logger')(config.verbose);
      logger.warn('Merging page objects with the same name: ' + page);
    }

    that.When[name] = _.extend(that.When[name], definition.actions);
    that.Then[name] = _.extend(that.Then[name], definition.assertions);

    _.each(definition.arrangements, function (arrangement, name) {
      that.Given[name] = arrangement;
    });
  });
};

module.exports = {
  register: function (namespace) {
    _.extend(namespace, new PageObjectFactory());
  }
};
