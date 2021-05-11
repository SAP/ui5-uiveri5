
describe("PageObjectFactory", function () {
  var pageObjectFactory = require('../src/pageObjectFactory');
  var logger = require('../src/logger');

  it("Should create Page objects in provided context with standard name pattern 'onThe<Name>Page'", function () {
    const context = {};
    pageObjectFactory.register(context);

    const arrangements = { iStartSomething: function () { } };
    const actions = { iDoSomething: function () { } };
    const assertions = { iAssertSomething: function () { } };

    context.createPageObjects({ "Test": { arrangements: arrangements, actions: actions, assertions: assertions } });

    expect(context.Given.iStartSomething).toEqual(arrangements.iStartSomething);
    expect(context.When.onTheTestPage).toEqual(actions);
    expect(context.Then.onTheTestPage).toEqual(assertions);
  });

  it("Should extend Page objects with base class if 'baseClass' is provided", function () {
    const context = {};
    pageObjectFactory.register(context);

    const arrangements = { iStartSomething: function () { } };
    const actions = { iDoSomething: function () { } };
    const assertions = { iAssertSomething: function () { } };

    const baseArrangements = { iStartSomethingBasic: function () { } };
    const baseActions = { iDoSomethingBasic: function () { } };
    const baseAssertions = { iAssertSomethingBasic: function () { } };
    const CommonsPage = { arrangements: baseArrangements, assertions: baseAssertions, actions: baseActions }

    context.createPageObjects({ "Test": { baseClass: CommonsPage, arrangements: arrangements, assertions: assertions, actions: actions } });

    expect(context.Given).toEqual(Object.assign({}, baseArrangements, arrangements));
    expect(context.When.onTheTestPage).toEqual(Object.assign({}, baseActions, actions));
    expect(context.Then.onTheTestPage).toEqual(Object.assign({}, baseAssertions, assertions));
  });

});
