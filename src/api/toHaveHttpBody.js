
/**
 * @constructor
 *
 */
function ToHaveHttpBody(){

}

ToHaveHttpBody.prototype.register = function(matchers) {
  var toHaveHTTPBody = function() {
    return {
      compare: function(actualResponse, expectedResponse) {
        var result = {};
        var actualBodyString = JSON.stringify(actualResponse.body);
        var expectedBodyString = JSON.stringify(expectedResponse);

        result.pass = actualBodyString == expectedBodyString;
        result.message = 'Expected request response to have body: ' + expectedBodyString
          + ', but have: ' + actualBodyString;

        return result;
      }
    };
  };

  matchers.toHaveHTTPBody = toHaveHTTPBody;
};

module.exports = function(){
  return new ToHaveHttpBody();
};
