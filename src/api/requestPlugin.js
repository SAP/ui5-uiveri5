var superagent = require('superagent');
var logger = require('../logger')(3);

var CSRF_HEADER = 'x-csrf-token';
function RequestPlugin() {

}

RequestPlugin.prototype.setup = function() {
  var that = this;
  var controlFlow = browser.controlFlow();
  
  var flow = function(superagent) { 
    superagent.do = function() {
      var self = this;
      return controlFlow.execute(function () {
        return self.then();
      });
    };
  };

  var csrf = function (options) {
    options = options || {};
    if (options.token) {
      that.csrfToken = options.token;
    } else if (options.url) {
      return controlFlow.execute(function () {
        return this.get(options.url)
          .set(CSRF_HEADER, 'Fetch')
          .do()
          .then(function (res) {
            if (res.headers[CSRF_HEADER]) {
              that.csrfToken = res.headers[CSRF_HEADER];
            } else {
              logger.error('Cannot generate CSRF token: missing X-CSRF-Token header');
            }
          }).catch(function (err) {
            logger.error('Error in generating CSRF token. Details: ' + err);
          });
      }.bind(this));
    }
  };

  global.request = superagent.agent().use(flow);
  
  global.request.csrf = csrf;
  
  var originalPost = global.request.post;
  global.request.post = function () {
    if (that.csrfToken) {
      this.set(CSRF_HEADER, that.csrfToken);
    }
    return originalPost.apply(this, arguments);
  };
};

module.exports = function () {
  return new RequestPlugin();
};
