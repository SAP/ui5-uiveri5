var plugins = [];

module.exports = function (moduleLoader) {
  plugins = moduleLoader.loadModule('plugins');

  function loadJasminePlugins() {
    return {
      suiteStarted: function(jasmineSuite){
        callPlugins('suiteStarted', [{name:jasmineSuite.description}]);
      },
      specStarted: function(jasmineSpec){
        callPlugins('specStarted', [{name:jasmineSpec.description}]);
      },
      specDone: function(jasmineSpec){
        callPlugins('specDone', [{name:jasmineSpec.description}]);
      },
      suiteDone: function(jasmineSuite){
        callPlugins('suiteDone', [{name:jasmineSuite.description}]);
      }
    };
  }

  function loadRunnerPlugins() {
    return [{
      inline: {
        setup: function() {
          callPlugins('setup');
        },
        onPrepare: function() {
          callPlugins('onPrepare');
        },
        teardown: function() {
          callPlugins('teardown');
        }
      }
    }];
  }

  function callPlugins(method, pluginData) {
    // call a method on every plugin, granted that it is defined
    return Promise.all(
      plugins.map(function (plugin) {
        if (plugin[method]) {
          return plugin[method].apply(plugin, pluginData);
        }
      })
    );
  }

  return {
    loadJasminePlugins: loadJasminePlugins,
    loadRunnerPlugins: loadRunnerPlugins,
    callPlugins: callPlugins
  };
};
