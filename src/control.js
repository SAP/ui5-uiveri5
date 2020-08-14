function Control(elementArrayFinder) {
  this.getWebElements = elementArrayFinder.getWebElements.bind(elementArrayFinder);
}

Control.prototype.getProperty = function (property) {
  return this.getWebElements()
    .then(function (webElements) {
      // at least one element is found, elsewise webdriver.error.ErrorCode.NO_SUCH_ELEMENT is thrown
      return webElements[0].getAttribute('id');
    })
    .then(function (elementId) {
      return browser.executeScriptHandleErrors('getControlProperty', {
        elementId: elementId,
        property: property
      });
    });
};

module.exports = Control;
