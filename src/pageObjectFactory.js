var _ = require('lodash');
var logger = require('./logger');

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

    var poName = 'onThe' + page + 'Page';

    if (that.When[poName] || that.Then[poName]) {
      logger.info('Merging page objects with the same name: ' + poName);
    }

    that.When[poName] = _.extend(that.When[poName], definition.actions);
    that.Then[poName] = _.extend(that.Then[poName], definition.assertions);

    // add arrangements directly to Given (and not to Given.onThe<Name>Page)
    _.each(definition.arrangements, function (arrangement, arrangementName) {
      if (that.Given[arrangementName]) {
        logger.info('Overriding arrangement with the same name: ' + arrangementName);
      }
      that.Given[arrangementName] = arrangement;
    });
  });
};

module.exports = {
  register: function (namespace) {
    _.extend(namespace, new PageObjectFactory());
  }
};
