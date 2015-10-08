exports.config = {
  connection: 'direct',
  connectionConfigs: {
    'direct': { connectionProvider : './directConnectionProvider' }//,
    //'sauselabs': { connectionProvider : './sauselabsConnectionProvider' },
    //'browserstack': { connectionProvider : './browserstackConnectionProvider' },
  },

  browserCapabilities: {
    'browser': {
      'android': {
        deviceName: 'android'
      }
    },
    'chrome,chromium': {
      'windows,mac,linux': {
        chromeOptions: {
          args: ['start-maximized']
        }
      }
    },
    'firefox,ie': {
      'windows,mac,linux': {
        remoteWebDriverOptions: {
          maximized: true//,
          /*
          position: {
            width: 800,
            height: 600
          },
          size: {
            x: 100,
            y: 100
          }
          */
        }
      }
    }
  }
};
