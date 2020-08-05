var _ = require('lodash');

function ExpectationPlugin() {
}

ExpectationPlugin.prototype.onExpectation = function (expectationCb) {
  var that = this;
  var originalAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;

  jasmine.Spec.prototype.addExpectationResult = function (passed, expectation) {
    var specResult = this.result;
    var expectationResult = originalAddExpectationResult.apply(this, arguments);
    var category = passed ? 'passedExpectations' : 'failedExpectations';

    _.last(specResult[category]).shortMessage = that._createShortMessage(expectation);
    _.last(specResult[category]).fullMessage = that._createFullMessage(expectation);

    expectationCb(expectation, specResult, category);

    return expectationResult;
  };
};

ExpectationPlugin.prototype._createShortMessage = function (expectation) {
  return ['Expected', '\'' + expectation.actual + '\'', expectation.matcherName, '\'' + expectation.expected + '\''].join(' ');
};

ExpectationPlugin.prototype._createFullMessage = function (expectation) {
  var sExpectation = 'Expectation ' + (expectation.passed ? 'passed' : 'failed') + '.';
  if (expectation.matcherName) {
    sExpectation += ' Expected "' + expectation.actual + '" ' + expectation.matcherName + ' "' + expectation.expected + '".';
  }
  if (expectation.message) {
    sExpectation += ' Message: "' + expectation.message + '". ';
  }
  if (!expectation.passed && expectation.error) {
    sExpectation += ' Error: "' + expectation.error + '". ';
  }

  return sExpectation;
};

module.exports = ExpectationPlugin;
