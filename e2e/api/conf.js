exports.config = {
  profile: 'api',

  baseUrl: 'https://sapui5.hana.ondemand.com/sdk/',

  browsers: [{
    browserName: 'chrome',
    capabilities: {
      chromeOptions: {
        args: ['--headless', '--no-sandbox']
      }
    }
  }]
};
