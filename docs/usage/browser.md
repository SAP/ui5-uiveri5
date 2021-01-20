## Loading a page
To load a new page, use `browser.get()`. This method will load the new page and will automatically load UIVeri5 instrumentation in the new UI5 runtime and will wait for the application to fully load before proceeding with test execution.
```javascript
browser.get("https://openui5.hana.ondemand.com/test-resources/sap/m/demokit/master-detail/webapp/test/mockServer.html");
// the application is loaded and now we can interact with the page
expect(browser.getTitle()).toBe('Master-Detail');
```

## Loading a protected page
With `browser.get()` you can also load a page that requires authentication. You can pass
authentication parameters directly as an inline object to the `auth` property.
The plain authenticator is applied by default. It simply waits for the requested page to be loaded
and doesn't perform any authentication.
The accepted authentication strategies and parameters are described in [Authentication](../config/authentication.md).

Example with inline parameters for form authentication:
```javascript
browser.get('<url>', {
    auth: {
        'sapcloud-form': {
            user: '<user>',
            pass: '<pass>'
        }
    }
});
```
Example with plain authentication:
```javascript
browser.get('<url>');
```

## Reload the app
To reload the current page, use `browser.refresh()`. This method will reload the current page, will automatically load UIVeri5 instrumentation in the new UI5 runtime and will wait for the application to fully load before proceeding with test execution.

## Application initiated page reload
If the application initiates a page reload with location.reload() or window.location modification or HTTP redirect, you will get the 
`Failed: javascript error: uiveri5 is not defined` error on first interaction with the page because the UIVeri5 instrumentation is missing in the new UI5 runtime. 
To work around this, you first need to wait for the page reload to finish. You should use `browser.driver` API and poll for existence of some specific element that would indicate the page is fully loaded:
```javascript
browser.driver.wait(function(){
      return browser.driver.findElements(by.css('<css selector>')).then(function (elements) {
        return !!elements.length;
      });
    }, browser.getPageTimeout, 'Waiting for page reload to finish');
```
Please note you can't use element() call and by.control() locators because they require the misising instrumentation.
Once the UI5 runtime is loaded, you can inject the UIVeri5 instrumentation by calling:
```javascript
browser.loadUI5Dependencies()`. 
```
After this call, the UI5 synchronization and control locators will work again in the new UI5 runtime.

If the application opens the new UI5 page in a new window (popup or tab) or IFrame, you will first need to focus it by using the `browse.driver.switchTo()` [API](https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_TargetLocator.html) and just then synchronize with it and inject the instrumentation. If the app in the new tab needs new authentication, replace the `loadUI5Dependencues();` call `with browser.go(<url>,<auth object>);`
```javascript
browser.driver.getAllWindowHandles().then(function (handles) {
  browser.switchTo().window(handles[handles.length - 1]).then(function () {
    // load uiveri5 instrumentation so by.control works
    browser.loadUI5Dependencies();
  
    // work with UI5 controls
    ...
  });
});
```

