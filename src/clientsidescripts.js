var functions = {};

functions.waitForAngular = function(rootSelector, callback) {
  var el = document.querySelector(rootSelector);

  try {
    if (!window.angular) {
      throw new Error('sapui5 could not be found on the window');
    }
    if (angular.getTestability) {
      angular.getTestability(el).whenStable(callback);
    } else {
      if (!angular.element(el).injector()) {
        throw new Error('root element (' + rootSelector + ') has no injector.' +
        ' this may mean it is not inside ng-app.');
      }
      angular.element(el).injector().get('$browser').
        notifyWhenNoOutstandingRequests(callback);
    }
  } catch (err) {
    callback(err.message);
  }
};

/* Publish all the functions as strings to pass to WebDriver's
 * exec[Async]Script.  In addition, also include a script that will
 * install all the functions on window (for debugging.)
 *
 * We also wrap any exceptions thrown by a clientSideScripts function
 * that is not an instance of the Error type into an Error type.  If we
 * don't do so, then the resulting stack trace is completely unhelpful
 * and the exception message is just "unknown error."  These types of
 * exceptins are the common case for dart2js code.  This wrapping gives
 * us the Dart stack trace and exception message.
 */
var util = require('util');
var scriptsList = [];
var scriptFmt = (
'try { return (%s).apply(this, arguments); }\n' +
'catch(e) { throw (e instanceof Error) ? e : new Error(e); }');
for (var fnName in functions) {
  if (functions.hasOwnProperty(fnName)) {
    exports[fnName] = util.format(scriptFmt, functions[fnName]);
    scriptsList.push(util.format('%s: %s', fnName, functions[fnName]));
  }
}

exports.installInBrowser = (util.format(
  'window.clientSideScripts = {%s};', scriptsList.join(', ')));
