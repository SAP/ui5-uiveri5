exports.config = {
  specResolver: './resolver/localSpecResolver',
  pageLoading: {
    /* used to overcome issues due to pending async  work that was started before the waitForUI5 was injected */
    wait: '3000'
  },

  
  // // after suite, not like protractor's after test
  // restartBrowserBetweenSuites: true,

  takeScreenshot: {
    onExpectFailure: true,
    onExpectSuccess: true,
    onAction: true
  },
  reporters: [
    {name: './reporter/screenshotReporter'}
  ]
};
