var logger = require('../logger')(3);

var CSRF_HEADER = 'x-csrf-token';

function CsrfAuthenticator(options){
  options = options || {};
  this.user = options.user;
  this.pass = options.pass;
  this.csrfHeader = options.csrfHeader;
  this.csrfFetchUrl = options.csrfFetchUrl;
}

CsrfAuthenticator.prototype.authenticate = function () {
  var that = this;
  if (this.csrfFetchUrl) {
    return request.get(this.csrfFetchUrl)
      .set(CSRF_HEADER, 'Fetch')
      .do()
      .then(function (res) {
        if (res.headers[CSRF_HEADER]) {
          that.csrfHeader = res.headers[CSRF_HEADER];
        } else {
          logger.error('Cannot generate CSRF token: missing X-CSRF-Token header');
        }
      }).catch(function (err) {
        logger.error('Error in generating CSRF token. Details: ' + err);
      });
  }
};

CsrfAuthenticator.prototype.modifyCall = function (req) {
  if (this.csrfHeader) {
    req.set(CSRF_HEADER, this.csrfHeader);
  }
  // superagent will add the cookies e.g. _csrf cookie
  return req;
};

module.exports = CsrfAuthenticator;
