exports.config = {
  browserCapabilities: {
    chrome: {
      chromeOptions: {
        args: ['start-maximized']
      }
    },
    generic: {
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
};
