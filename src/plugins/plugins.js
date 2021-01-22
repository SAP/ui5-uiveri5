var pluginModules = [];
var currentSpecDescription;

var Plugins = function (aPluginModules) {
  pluginModules = aPluginModules;
};

Plugins.prototype.loadJasminePlugins = function () {
  // when a spec (and all its accompanying methods like before, after) starts to execute, save its description 
  var originalSpecExecute = jasmine.Spec.prototype.execute;
  jasmine.Spec.prototype.execute = function () {
    // 'this' is the current Spec
    currentSpecDescription = this.result.description;
    originalSpecExecute.apply(this, arguments);
  };

  jasmine.getEnv().addReporter({
    jasmineStarted: function () {
      // load Jasmine plugins.
      // in jasmine 2.x, the reporter callbacks can't handle promises, so we use a workaround
      // by adding the plugin callbacks as before* and after* functions (which can handle promises)
      var root = jasmine.getEnv().topSuite();
      _addPlugins(root);
    }
  });
};

['setup', 'onPrepare', 'teardown', 'onConnectionSetup', 'postTest',
  'getResults', 'postResults', 'skipAngularStability', 'waitForPromise', 'waitForCondition'].forEach(function (sEvent) {
  Plugins.prototype[sEvent] = function () {
    return _callPlugins(sEvent, arguments);
  };
});

function _callPlugins(method, args) {
  // TODO fix waitForCondition plugins
  if (method === 'waitForCondition') {
    return Promise.resolve([true]);
  }
  return Promise.all(
    pluginModules.map(function (module) {
      if (module[method]) {
        return module[method].apply(module, args);
      }
    })
  );
}

function _addPlugins (root) {
  if (root.children) {
    root.children.filter(function (child) {
      return child instanceof jasmine.Suite && !child.disabled;
    }).forEach(function (child) {
      child.beforeAllFns.push(_callJasmineSuitePlugins('suiteStarted', child.result.description));
      child.beforeFns.push(_callJasmineSpecPlugins('specStarted'));
      child.afterFns.push(_callJasmineSpecPlugins('specDone'));
      child.afterAllFns.push(_callJasmineSuitePlugins('suiteDone', child.result.description));

      _addPlugins(child);
    });
  }
}

function _callJasmineSuitePlugins(method, suiteDescription) {
  return {
    fn: _callPlugins.bind(this, method, [{name: suiteDescription}]),
    timeout: function() {
      return jasmine.DEFAULT_TIMEOUT_INTERVAL;
    }
  };
}

function _callJasmineSpecPlugins(method) {
  return {
    fn: function () {
      return _callPlugins.call(this, method, [{name: currentSpecDescription}]);
    },
    timeout: function() {
      return jasmine.DEFAULT_TIMEOUT_INTERVAL;
    }
  };
}

module.exports = Plugins;
