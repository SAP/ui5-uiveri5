
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
            '*': {
              matched: true
            }
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
            "*": {
              key: 'new_value'
            }
          }
        }
      });
      expect(runtime.capabilities.key).toBe('value');
    });

    it('Should merge arrays in capabilities', function() {
      var runtime = {
        capabilities: {
          chromeArgs: {
            args: ['one']
          },
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
            "*" : {
              chromeArgs: {
                args: ['two']
              }
            }
          }
        }
      });
      expect(runtime.capabilities.chromeArgs.args).toEqual(['two','one']);

    });

    it('Should remove duplicates from merged arrays', function() {
      var runtime = {
        capabilities: {
          chromeArgs: {
            args: ['one']
          },
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
            "*" : {
              chromeArgs: {
                args: ['one','two']
              }
            }
          }
        }
      });
      expect(runtime.capabilities.chromeArgs.args).toEqual(['one','two']);

    });
  });

  describe('Should merge with execution type capabilities', function() {
    it('Should merge matched execution types, first wins', function() {
      var runtime = {
        capabilities: {
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
                key: 'local'
              },
              'remote': {
                key: 'remote'
              },
              '*': {
                key: 'all'
              }
            }
          }
        });

      expect(runtime.capabilities.key).toBe('remote');
    });
  });
});
