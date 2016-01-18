exports.config = {
  specResolver: './resolver/localUI5SpecResolver',
  //storageProvider: './image/localStorageProvider',
  storageProvider: {name: './image/localStorageProvider',refImagesRoot: './target'},
  screenshotProvider: {name: './image/localScreenshotProvider',screenshotSleep: 100},
  comparisonProvider: './image/localComparisonProvider',

  baseUrlQuery: ['sap-ui-animation=false']
};
