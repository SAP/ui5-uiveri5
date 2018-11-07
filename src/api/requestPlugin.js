var superagent = require('superagent');

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

  global.request = superagent.agent().use(flow);
};

module.exports = function () {
  return new RequestPlugin();
};
