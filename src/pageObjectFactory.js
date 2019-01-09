var _ = require('lodash');

var PageObjectFactory = function () {
  this.Given = {};
  this.When = {};
  this.Then = {};
};

PageObjectFactory.prototype.createPageObjects = function (pageObjects) {
  var that = this;

  _.each(pageObjects, function (definition, page) {
    var name = 'onThe' + page + 'Page';

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
