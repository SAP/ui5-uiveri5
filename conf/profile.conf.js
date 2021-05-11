exports.config = {
  // timeouts in ms, keep proportions when modifying
  timeouts: {
    waitForUI5Delta: 200,
    getPageTimeout: 10000,
    allScriptsTimeout: 11000,
    defaultTimeoutInterval: 30000,
    waitForUI5PollingInterval: 400
  },
  connection: 'direct',
  connectionConfigs: {
    'direct': {
      name : './connection/directConnectionProvider',
      binaries: {
        selenium: {
          version: '3.12',
          patch: '0',
          filename: 'selenium-server-standalone',
          url: 'https://selenium-release.storage.googleapis.com/${connectionConfigs.direct.binaries.selenium.version}/' +
          '${connectionConfigs.direct.binaries.selenium.filename}-${connectionConfigs.direct.binaries.selenium.version}.' +
          '${connectionConfigs.direct.binaries.selenium.patch}.jar',
          executable: '${connectionConfigs.direct.binaries.selenium.filename}-${connectionConfigs.direct.binaries.selenium.version}.' +
          '${connectionConfigs.direct.binaries.selenium.patch}.jar'
        },
        chromedriver: {
          version: '{chrome.latest}',
          unzip: true,
          filename: '${osTypeString == "win32" ? "chromedriver.exe" : "chromedriver"}',
          baseurl: 'https://chromedriver.storage.googleapis.com',
          url: '${connectionConfigs.direct.binaries.chromedriver.baseurl}/${connectionConfigs.direct.binaries.chromedriver.version}/' +
          'chromedriver_${osTypeString}.zip',
          latestVersionUrl: '${connectionConfigs.direct.binaries.chromedriver.baseurl}/LATEST_RELEASE_${connectionConfigs.direct.binaries.chromedriver.version}',
          latestMajorVersionFileUrl: 'https://raw.githubusercontent.com/SAP/ui5-uiveri5/master/driverVersions.json',
          latestVersionDirectUrl: '${connectionConfigs.direct.binaries.chromedriver.baseurl}/LATEST_RELEASE',
          useDirectUrl: true,
          executable: {
            win32: 'chromedriver-${connectionConfigs.direct.binaries.chromedriver.version}.exe',
            mac64: 'chromedriver-${connectionConfigs.direct.binaries.chromedriver.version}',
            linux32: 'chromedriver-${connectionConfigs.direct.binaries.chromedriver.version}',
            linux64: 'chromedriver-${connectionConfigs.direct.binaries.chromedriver.version}'
          }
        },
        // for screenshots to work we need to use 32bit IE even with 64bit systems
        iedriver: {
          version: '3.12',
          patch: '0',
          unzip: true,
          filename: 'IEDriverServer.exe',
          url: 'http://selenium-release.storage.googleapis.com/${connectionConfigs.direct.binaries.iedriver.version}/' +
          'IEDriverServer_Win32_${connectionConfigs.direct.binaries.iedriver.version}.' + '${connectionConfigs.direct.binaries.iedriver.patch}.zip',
          executable: 'IEDriverServer.exe'
        },
        geckodriver: {
          version: '{latest}',
          unzip: '${osTypeString == "win32" || osTypeString == "win64"}',
          untar: '${!(osTypeString == "win32" || osTypeString == "win64")}',
          filename: '${osTypeString == "win32" ? "geckodriver.exe" : "geckodriver"}',
          baseurl: 'http://github.com/mozilla/geckodriver/releases',
          url: '${connectionConfigs.direct.binaries.geckodriver.baseurl}/download/${connectionConfigs.direct.binaries.geckodriver.version}' +
          '/geckodriver-${connectionConfigs.direct.binaries.geckodriver.version}-${osTypeString == "mac64" ? "macos" : osTypeString}' +
          '${osTypeString == "win32" || osTypeString == "win64" ? ".zip" : ".tar.gz"}',
          latestVersionRedirectUrl: '${connectionConfigs.direct.binaries.geckodriver.baseurl}/latest',
          executable: {
            win32: 'geckodriver-${connectionConfigs.direct.binaries.geckodriver.version}.exe',
            win64: 'geckodriver-${connectionConfigs.direct.binaries.geckodriver.version}.exe',
            mac64: 'geckodriver-${connectionConfigs.direct.binaries.geckodriver.version}',
            linux32: 'geckodriver-${connectionConfigs.direct.binaries.geckodriver.version}',
            linux64: 'geckodriver-${connectionConfigs.direct.binaries.geckodriver.version}'
          }
        }
      }
    }//,
    //'sauselabs': { name : './connection/sauselabsConnectionProvider' },
    //'browserstack': { name : './connection/browserstackConnectionProvider' },
  },

  browserCapabilities: {
    /* appium/android require deviceName */
    'browser,chrome': {
      'android': {
        '*': {
          deviceName: 'android'
        }
      }
    },
    /* maximize browser on all desktops to ensure consistent browser size */
    'firefox,ie,edge,safari,chrome,chromium': {
      'windows,mac,linux': {
        '*': {
          remoteWebDriverOptions: {
            maximized: true
          },
          /*
          seleniumOptions: {
            args: ['-debug', '-log','selenium.log']
          },
          firefoxOptions: {
            addArguments: ['-foreground']
          },
          geckodriverOptions: {
            enableVerboseLogging: []
          },
          */
        }
      }
    },
    /* disable inforbars on chrome */
    /* chrome and/or chromedriver does not like the maximize command so try with args */
    'chrome,chromium': {
      '*': {
        '*': {
          chromeOptions: {
            args: [
              '--no-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              'disable-infobars'
            ]
          },
          /*
          chromedriverOptions: {
            'enableVerboseLogging': [],
            'loggingTo': ['chromedriver.log']
          }
          */
        }
      }
    },
    /* use safaridriver legact options for capabilities */
    'safari': {
      'mac': {
        '*': {
          safaridriverOptions: {
            addArguments: ['--legacy']
          },
        }
      }
    },
    /* configure default Galaxy S7 emulation */
    'chromeMobileEmulation': {
      '*': {
        '*': {
          browserName: 'chrome',
          remoteWebDriverOptions: {
            maximized: false,
            scaling: {
              x: 4.0,
              y: 4.0
            }
          },
          chromeOptions: {
            mobileEmulation: {
              deviceMetrics: {
                width: 360,
                height: 560,
                pixelRatio: 4
              }
            },
            args: [
              '--no-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--disable-infobars'
            ]
          }
        }
      }
    },
    'chromeHeadless': {
      '*': {
        '*': {
          browserName: 'chrome',
          chromeOptions: {
            args: [
              '--headless',
              '--no-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--disable-infobars'
            ]
          }
        }
      }
    }
    
    /* WARNING: ignoring protected mode may introduce errors
     * A better solution would be to configure your IE browser:
     * https://github.com/seleniumQuery/seleniumQuery/wiki/seleniumQuery-and-IE-Driver#protected-mode-exception-while-launching-ie-driver
     */
    /*
    'ie': {
      '*': {
        '*': {
          iedriverOptions: {
            introduceFlakinessByIgnoringProtectedModeSettings: ['true']
          },
          ieOptions: {
            addArguments: ['-foreground']
          }
        }
      }
    },
    */
    /*
    'edge': {
      '*': {
        '*': {
          edgedriverOptions: {
            'setPageLoadStrategy': ['normal'],
          }
        }
      }
    }
    */
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
      userFieldSelector: '#USERNAME_BLOCK input',
      passFieldSelector: '#PASSWORD_BLOCK input',
      logonButtonSelector: '#LOGIN_LINK'
    },
    'sapcloud-form': {
      name: './authenticator/formAuthenticator',
      userFieldSelector: '#j_username',
      passFieldSelector: '#j_password',
      logonButtonSelector: '#logOnFormSubmit'
    },
    'github-form': {
      name: './authenticator/formAuthenticator',
      userFieldSelector: '#login_field',
      passFieldSelector: '#password',
      logonButtonSelector: 'input[type=submit]',
      authorizationButtonSelector: 'button[type=submit]',
      authorizationButtonTimeout: 10000
    }
  },

  reporters: [
    {name: './reporter/consoleReporter'}
  ],
  locators: [
    {name: './locators/jqueryLocator'},
    {name: './locators/controlLocator'}
  ],

  plugins: [
    {name: './plugins/browserLogsPlugin'}
  ],

  matchers: [],

  log: {
    browser: {
      level: 'SEVERE'
    }
  }

};
