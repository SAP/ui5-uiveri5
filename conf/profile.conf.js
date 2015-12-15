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
    'firefox,ie,safari': {
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

  auth: 'plain',
  authConfigs: {
    'plain': {
      name: './authenticator/plainAuthenticator'
    },
    'basic': {
      name: './authenticator/basicUrlAuthenticator'
    },
    'fiori-form': {
      name: './authenticator/formAuthenticator',
      userFieldSelector: '#USERNAME_FIELD input',
      passFieldSelector: '#PASSWORD_FIELD input',
      logonButtonSelector: '#LOGIN_LINK'
    },
    'sapcloud-form': {
      name: './authenticator/formAuthenticator',
      userFieldSelector: '#j_username',
      passFieldSelector: '#j_password',
      logonButtonSelector: '#logOnFormSubmit'
    }
  },

  reporters: [
    {name: './reporter/consoleReporter'}
  ],

  locators: [
    {name: './defaultLocators'}
  ]
};
