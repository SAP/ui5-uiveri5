
/**
 * @constructor
 *
 */
function ToHaveHttpHeader(){

}

ToHaveHttpHeader.prototype.register = function(matchers) {
  var toHaveHTTPHeader = function() {
    return {
      compare: function(actualResponse, expectedResponse) {
        var result = {};
        var pass = false;
        var expectedHeaderName = expectedResponse[0].toLowerCase();
        var expectedHeaderValue = expectedResponse[1].toLowerCase();

        if(actualResponse.header && actualResponse.header[expectedHeaderName]) {
          if(actualResponse.header[expectedHeaderName].indexOf(expectedHeaderValue) >= 0) {
            pass = true;
          }
        }

        result.pass = pass;
        result.message = 'Expected request response to have header: ' + JSON.stringify(expectedResponse)
          + ', but have: ' + JSON.stringify(actualResponse.header);

        return result;
      }
    };
  };

  matchers.toHaveHTTPHeader = toHaveHTTPHeader;
};

module.exports = function(){
  return new ToHaveHttpHeader();
};
