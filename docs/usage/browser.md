# Browser Navigation
You can use all the methods that directly wrap the driver navigation API, such as
`browser.driver.get()` and the `browser.navigate()` API. Note that methods of `browser.driver`
don't automatically synchronize with UI5 and using them can result in test failures.

In case of a page reload or redirect, you will receive an error stating that UIVeri5 dependencies are not loaded:
`Failed: javascript error: uiveri5 is not defined`
It is recommended to use the API provided by UIVeri5. The API is kept very similar to Protractor API
so it is easy and familiar to most users.

## Loading a page
To reload the current page, use `browser.refresh()`. To load a new page, use `browser.get()`.
Both methods return a webdriver promise and are synchronized with the control flow.
Both methods will automatically load UIVeri5 dependencies on the new page and wait for the
application to load before test execution continues.
```javascript
browser.get("https://openui5.hana.ondemand.com/test-resources/sap/m/demokit/master-detail/webapp/test/mockServer.html");
// the application is loaded and now we can interact with the page
expect(browser.getTitle()).toBe('Master-Detail');
```

## Loading a protected page
With `browser.get()` you can also get a page that requires authentication. You can pass
authentication parameters directly as an inline object to the `auth` property.
The plain authenticator is applied by default. It simply waits for the requested page to be loaded
and doesn't perform any authentication.
The accepted authentication strategies and parameters are described in [Authentication](../config/authentication.md).

Example inline parameters for form authentication:
```javascript
browser.get('<url>', {
    auth: {
        'sapcloud-form': {
            user: '<user>',
            pass: '<pass>',
            redirectUrl: /console\/tenant\_/
        }
    }
});
```
Example with plain authentication:
```javascript
browser.get('<url>');
```

## Synchronization
If you have a very advanced navigation or authentication scenario, you can explicitly
load UIVeri5 browser dependencies and synchronize with UI5 using the method `browser.loadUI5Dependencies()`.
It returns a promise and is synchronized with the control flow. Call this method only once after a page is loaded.
In standard scenarios this is not necessary and we recommend against using it.
