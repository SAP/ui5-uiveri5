# Plugins

## Browser Logs Plugin
This plugin outputs the logs that appeared in the browser during `spec` execution, at the end of each spec.
It is activated by default.

You can choose to filter the browser logs by severity level. Enter the required level in the `log` configuration:
```javascript
log: {
  browser: {
    level: 'DEBUG'
  }
}
```

The available log levels for Chrome are:
```javascript
'OFF'
'SEVERE'
'WARNING'
'INFO'
'DEBUG'
'ALL'
```

The default log level is `'SEVERE'`. This means that all browser errors logs will be logged to the UIVeri5 command output.

Note that this relies on a relatively new webdriver specification that is still implemented differently for each browser.
For more information, check out the [`selenium-webdriver` documentation](https://github.com/SeleniumHQ/selenium/wiki/Logging).
