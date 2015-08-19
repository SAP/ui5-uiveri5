exports.config = {
  profile: 'visual',
  //baseUrl: 'http://localhost:8080'
  //libFilter: '*' // comma separated list of library names, defaults to *
  //specFilter: '*' // comma separated list of specs, defaults to *
  browserCapabilities: {
    chrome: {
      chromeOptions: {
        args: ['start-maximized']
      }
    }
  }
}
