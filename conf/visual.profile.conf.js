exports.config = {
  specResolver: {name: './resolver/localUI5SpecResolver'},
  storageProvider: {name: './image/localStorageProvider',refImagesRoot: './target'},
  screenshotProvider: {name: './image/localScreenshotProvider',screenshotSleep: 100},
  comparisonProvider: {name: './image/localComparisonProvider'},

  baseUrlQuery: ['sap-ui-animation=false','sap-ui-theme=sap_${runtimes[0].ui5.theme}','sap-ui-rtl=${runtimes[0].ui5.direction === \'rtl\'}','sap-ui-xx-formfactor=${runtimes[0].ui5.mode}'],

  /* android,ios,mac,firefox do not support mouseMove -> click with actions */
  browserCapabilities: {
    'chrome,chromium,ie': {
      'windows,linux': {
        '*': {
          /*
          remoteWebDriverOptions: {
            enableClickWithActions: true
            contextSwitch: true, // {native: 'NATIVE_APP', webview: 'WEBVIEW_1'}
            crops: {
              size: {
                height: 684   // missing height or width mean full size
              },
              position: {
                y: 116        // missing x or y mean 0
              },
              scaling: {
                x: 1.5,
                y: 1.5
              }
            },
            browserSize: {
              width: 1920,
              height: 1067
            },
            viewportSize: {
              width: 1920,
              height: 1067
            }
          }
          */
        }
      }
    }
  }
};
