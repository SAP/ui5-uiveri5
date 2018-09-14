var superagent = require('superagent');

module.exports = function(){
  var controlFlow = browser.controlFlow();
  var originalEnd = superagent.Request.prototype._end;

  superagent.Request.prototype._end = function end(fn) {
    var that = this;
    return controlFlow.execute(function () {
      return originalEnd.call(that, fn);
    });
  };

  return superagent;
};
