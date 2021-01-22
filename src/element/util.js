var selenium_webdriver = require('selenium-webdriver');

/**
 * Returns false if an error indicates a missing or stale element,
 * otherwise, re-throws the error
 *
 * @param {*} The error to check
 * @throws {*} The error it was passed, if it doesn't indicate a missing or stale element
 * @return {boolean} false, if it doesn't re-throw the error
 */
function falseIfMissing(error) {
  if (error instanceof selenium_webdriver.error.NoSuchElementError ||
    error instanceof selenium_webdriver.error.StaleElementReferenceError) {
    return false;
  } else {
    throw error;
  }
}

/**
 * Return a boolean given boolean value.
 *
 * @param {boolean} value
 * @returns {boolean} given value
 */
function passBoolean(value) {
  return value;
}

module.exports = {
  falseIfMissing: falseIfMissing,
  passBoolean: passBoolean
};
