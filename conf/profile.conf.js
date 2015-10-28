exports.config = {
  connection: 'direct',
  connectionConfigs: {
    'direct': { name : './connection/directConnectionProvider' }//,
    //'sauselabs': { name : './connection/sauselabsConnectionProvider' },
    //'browserstack': { name : './connection/browserstackConnectionProvider' },
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
  },

  reporters: [
    {name: './reporter/consoleReporter'}
  ]
};
