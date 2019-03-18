var should = require('should').noConflict();

module.exports = function(){
  return {
    register: function(matchers) {
      var body = function() {
        return {
          compare: function(actualResponse, expectedFn) {
            var result = {};
            var actualBody = actualResponse.body;
            actualBody.should = should(actualBody);

            try{
              expectedFn(actualBody);
              result.pass = true;
            } catch(error) {
              result.pass = false;
              result.message = error.stack;
            }

            return result;
          }
        };
      };
      matchers.body = body;
    }
  };
};
