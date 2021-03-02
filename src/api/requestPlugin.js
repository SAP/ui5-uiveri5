var superagent = require('superagent');
var CsrfAuthenticator = require('./csrfAuthenticator');
function RequestPlugin() {

}

RequestPlugin.prototype.setup = function() {
  var controlFlow = browser.controlFlow();
  
  var flow = function(superagent) { 
    superagent.do = function() {
      var self = this;
      return controlFlow.execute(function () {
        return self.then();
      });
    };
  };

  var request = superagent.agent().use(flow);

  request.authenticate = function (authenticator) {
    var originalPost = request.post;
    request.post = function () {
      authenticator.modifyCall(this);
      return originalPost.apply(this, arguments);
    };

    return authenticator.authenticate();
  };

  global.request = request;
  global.CsrfAuthenticator = CsrfAuthenticator;
};

module.exports = function () {
  return new RequestPlugin();
};
