var clientsidescripts = require('./scripts/clientsidescripts');

function Control(elementArrayFinder) {
  this.getWebElements = elementArrayFinder.getWebElements.bind(elementArrayFinder);
}

Control.prototype.getProperty = function (property) {
  return this.getWebElements().then(function (webElements) {
    // at least one element is found, elsewise webdriver.error.ErrorCode.NO_SUCH_ELEMENT is thrown
    return webElements[0].getAttribute('id');
  }).then(function (elementId) {
    return browser.executeScriptWithDescription(clientsidescripts.getControlProperty, 'Control.getProperty', {
      elementId: elementId,
      property: property
    });
  }).then(function (mResult) {
    if (mResult.error) {
      throw new Error('Error while investigating UI5 control properties. Details: ' + mResult.error);
    } else {
      return mResult.property;
    }
  });
};

module.exports = Control;
