var pages = {
  app: require('../fixture/apps/browser/app'),
  wait: require('../fixture/apps/browser/wait'),
  wait_recursive: require('../fixture/apps/browser/wait_recursive')
};

module.exports = {
  injectPageContent: function (browser, page) {
    if (pages[page]) {
      browser.executeScript(pages[page].create);
    }
  }
};
