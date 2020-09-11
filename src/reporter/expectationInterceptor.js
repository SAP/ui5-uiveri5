function ExpectationInterceptor() {
}

ExpectationInterceptor.prototype.onExpectation = function (expectationCb) {
  var originalAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;

  jasmine.Spec.prototype.addExpectationResult = function (passed, expectation) {
    var specResult = this.result;
    var expectationResult = originalAddExpectationResult.apply(this, arguments);
    var category = passed ? 'passedExpectations' : 'failedExpectations';

    expectationCb(expectation, specResult, category);

    return expectationResult;
  };
};

module.exports = new ExpectationInterceptor();
