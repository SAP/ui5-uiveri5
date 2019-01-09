
describe("RuntimeResolver", function() {
  var resolver = new require('../src/runtimeResolver')();

  describe("Should match browserCapabilities", function() {
    it('Should handle separate names', function () {
      var runtime = {
        capabilities: {},
        browserName: 'chrome',
        platformName: 'windows'
      };

      // override to return local execution
      resolver._getExecutionType = function() {
        return 'remote';
      };

      resolver._mergeMatchingCapabilities(runtime,{
        'chrome,chromium': {
          'windows,mac,linux': {
            'remote': {
              matched: true
            }
          }
        }
      });
      expect(runtime.capabilities.matched).toBe(true);
    });

    it('Should handle wildcard', function () {
      var runtime = {
        capabilities: {},
        browserName: 'chrome',
        platformName: 'windows'
      };

      resolver._getExecutionType = function() {
        return 'local';
      };

      resolver._mergeMatchingCapabilities(runtime,{
        'chrome': {
          '*': {
            '*': {
              matched: true
            }
          }
        }
      });
      expect(runtime.capabilities.matched).toBe(true);
    });

    it('Should handle excludes', function () {
      var runtime = {
        capabilities: {},
        browserName: 'chrome',
        platformName: 'windows'
      };

      // override to return local execution
      resolver._getExecutionType = function() {
        return 'remote';
      };

      resolver._mergeMatchingCapabilities(runtime,{
        'chrome': {
          '*,!windows': {
            matched: true
          }
        }
      });
      expect(runtime.capabilities.matched).toBeUndefined();
    });
  });

  describe("Should merge with runtime capabilities", function() {
    it('Runtime capabilities should overwrite browserCapabilities', function () {
      var runtime = {
        capabilities: {
          key: 'value'
        },
        browserName: 'chrome',
        platformName: 'windows'
      };

      // override to return local execution
      resolver._getExecutionType = function() {
        return 'remote';
      };

      resolver._mergeMatchingCapabilities(runtime, {
        'chrome,chromium': {
          'windows,mac,linux': {
            key: 'new_value'
          }
        }
      });
      expect(runtime.capabilities.key).toBe('value');
    });
  });

  describe('Should merge with execution type capabilities', function() {
    it('Should merge matched execution type - remote', function() {
      var runtime = {
        capabilities: {
          key: 'value'
        },
        browserName: 'chrome',
        platformName: 'windows'
      };

      resolver._getExecutionType = function() {
        return 'remote';
      };

      resolver._mergeMatchingCapabilities(runtime,
        {
          'chrome,chromium': {
            'windows,mac,linux': {
              'local': {
                'chromeOptions': {
                  'args': [
                    'start-maximized'
                  ]
                }
              },
              'remote': {
                'chromeOptions': {
                  'args': [
                    'start-minimized'
                  ]
                }
              },
              '*': {
                'chromeOptions': {
                  'args': [
                    'start-medium'
                  ]
                }
              }
            }
          }
        });

      expect(runtime.capabilities.chromeOptions.args[0]).toBe('start-minimized');
    });

    it('Should merge matched execution type - local', function() {
      var runtime = {
        capabilities: {
          key: 'value'
        },
        browserName: 'chrome',
        platformName: 'windows'
      };

      // override to return local execution
      resolver._getExecutionType = function() {
        return 'local';
      };

      resolver._mergeMatchingCapabilities(runtime,
        {
          'chrome,chromium': {
            'windows,mac,linux': {
              'local': {
                'chromeOptions': {
                  'args': [
                    'start-maximized'
                  ]
                }
              },
              'remote': {
                'chromeOptions': {
                  'args': [
                    'start-minimized'
                  ]
                }
              },
              '*': {
                'chromeOptions': {
                  'args': [
                    'start-medium'
                  ]
                }
              }
            }
          }
        });

      expect(runtime.capabilities.chromeOptions.args[0]).toBe('start-maximized');
    });

    it('Should merge matched execution type - all types', function() {
      var runtime = {
        capabilities: {
          key: 'value'
        },
        browserName: 'chrome',
        platformName: 'windows'
      };

      // override to return local execution
      resolver._getExecutionType = function() {
        return 'remote';
      };

      resolver._mergeMatchingCapabilities(runtime,
        {
          'chrome,chromium': {
            'windows,mac,linux': {
              '*': {
                'chromeOptions': {
                  'args': [
                    'start-medium'
                  ]
                }
              }
            }
          }
        });

      expect(runtime.capabilities.chromeOptions.args[0]).toBe('start-medium');
    });
  })
});
