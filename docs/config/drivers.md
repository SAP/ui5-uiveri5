# Drivers
All supported browsers need the respective WebDrivers. When using local execution (`seleniumAddress` not provided), the respective WebDriver and possibly selenium.jar are downloaded automatically on every execution and is kept in the `selenium` folder under the installation path.

The respective WebDriver version is specified in basic profile and can be overwritten:

- from the command line:
```
$ uiveri5 --config.connectionConfigs.direct.binaries.chromedriver.version=74.0.3729.6
```
- from conf.js:
 ```javascript
connectionConfigs: {
    direct: {
        binaries: {
            chromedriver: {
                version: "74.0.3729.6"
            }
        }
    }
}
```

You can also configure the use of local webdriver and thus disable the automatic download:

- from the command line:
```
$ uiveri5 --config.connectionConfigs.direct.binaries.chromedriver.localPath=C:/chromedriver.exe
```
- from conf.js:
```javascript
connectionConfigs: {
  direct: {
    binaries: {
      chromedriver: {
        localPath: 'C:/chromedriver.exe'
      }
    }
  }
}
```

## Generic WebDriver Options
Browser size and location can be specified in `browsers.capabilities.remoteWebDriverOptions`. The following options are listed in descending priority:
* position - sets offset of the browser relative to the upper-left screen corner
* viewportSize - sets inner size of the browser window (actual page display area)
* browserSize - sets outer size of the browser window (including window toolbars)
* maximized - maximizes the browser window

```javascript
browsers: [{
  browserName: 'chrome',
  capabilities: {
    remoteWebDriverOptions: {
      maximized: true,
      position: {
        x: 0,
        y: 0
      },
      viewportSize: {
        width: 1920,
        height: 1067
      },
      browserSize: {
        width: 1920,
        height: 1067
      }
    }
  }
}]
```

The maximize option might not be supported for all browsers. In such case, the `browserSize` option can be used for setting browser window size. 

Example:
```javascript
browsers: [{
  browserName: 'chrome',
  capabilities: {
    remoteWebDriverOptions: {
      maximized: false,
      browserSize: {
        width: 1920,
        height: 1067
      }
    }
  }
}]
```

## Selenium
By default, the respective WebDriver that starts the required browser is started directly. To start it by using Selenium jar, you have to enable it with setting `useSeleniumJar` to `true`. Then, Selenium command line arguments can be provided in the conf.js file:

```javascript
browsers: [{
  browserName: 'chrome',
  capabilities: {
    seleniumOptions: {
        args: ['-debug', '-log','selenium.log']
    },
  }
}]
```

List the available arguments by executing:
```
$ java -jar selenium-server-standalone-3.0.1.jar -help
```

## Chrome
Chrome uses the ChromeDriver which is updated regularly. By default, we use the latest ChromeDriver version suitable
for the latest stable Chrome release. The exact version of the latest stable release of Chrome is resolved from uiveri5 github repo. 

All ChromeDriver options from [ServiceBuilder](https://github.com/SeleniumHQ/selenium/blob/selenium-3.6.0/javascript/node/selenium-webdriver/chrome.js) can be specified under the `chromedriverOptions` key.

All chrome options from [Options](https://github.com/SeleniumHQ/selenium/blob/selenium-3.6.0/javascript/node/selenium-webdriver/chrome.js) can be specified under the `chromeOptions` key.

The values can be of type string or array of strings.

```javascript
browsers: [{
  browserName: 'chrome',
  capabilities: {
    chromedriverOptions: {
      loggingTo: 'chromedriver.log'
    },
    chromeOptions: {
      args: 'start-maximized'
    }
  }
}]
```

## Chromium
Chromium uses the same ChromeDriver as Chrome. But automatic download of ChromeDriver is not implemented for Chromium. Please make sure
you have the correct version of ChromeDriver for your Chromium version.

The easiest way to install Chromium and ChromeDriver on macOS is using the brew package manager. For stable versions of chromium and the corresponding chromedriver you can use:
```
$brew install --cask eloston-chromium 
# chromium is available as: /Applications/Chromium.app/Contents/MacOS/Chromium
$brew install --cask chromedriver
# chromedriver is available as: /usr/local/bin/chromedriver
```
Then you need to set the paths in the config file:
```javascript
browsers: [{
  browserName: 'chromium',
  capabilities: {
    chromeOptions: {
      binary: "/path/to/Chromium"
    }
  }
}],
connectionConfigs: {
  direct: {
    binaries: {
      chromedriver: {
        localPath: 'path/to/ChromeDriver'
      }
    }
  }
}
```
Or using command line:
```
$ uiveri5 --browsers=chromium --config.connectionConfigs.direct.binaries.chromedriver.localPath=path/to/ChromeDriver
--confKeys=browsers[0].capabilities.chromeOptions.binary:/path/to/Chromium
```

## Firefox
Firefox uses the geckodriver that is updated regularly, so by default, we use the latest version.

All geckodriverdriver options from [ServiceBuilder](https://github.com/SeleniumHQ/selenium/blob/selenium-3.6.0/javascript/node/selenium-webdriver/firefox/index.js) can be specified under the `geckodriverOptions` key.

All Firefox options from [Options](https://github.com/SeleniumHQ/selenium/blob/selenium-3.6.0/javascript/node/selenium-webdriver/firefox/index.js) can be specified under the `firefoxOptions` key.

The values can be of type string or array of strings.

```javascript
browsers: [{
  browserName: 'firefox',
  capabilities: {
    geckodriverOptions: {
      enableVerboseLogging: true
    },
    firefoxOptions: {
      addArguments: '-private',
      setBinary: '/path/to/firefox'
    }
  }
}]
```

Geckodriver expects to find Firefox executable on the system path or at the default location for the respective platform. In some installation or upgrade scnearios, it is possible that the Firefox binary is placed in a different location and geckodriver is not able to find it. One workaround is to add the path to the binary in the PATH environment variable. Another workaround is to provide the path to the Firefox binary in the `firefoxOptions`.

## Internet Explorer (IE)
IE uses the iedriver which is only available for Windows. Currently, you need to specify an exact version (automatic latest version detection is not implemented).

All iedriver options from [ServiceBuilder](https://github.com/SeleniumHQ/selenium/blob/master/javascript/node/selenium-webdriver/ie.js) can be specified under the `iedriverOptions` key.

All IE options from [Options](https://github.com/SeleniumHQ/selenium/blob/master/javascript/node/selenium-webdriver/ie.js) can be specified under the `ieOptions` key.

The values can be of type string or array of strings.

There is a [browser configuration](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver#required-configuration) that has to be followed before you start testing on IE. It is preferable to modify your browser's security settings as described [here](https://github.com/seleniumQuery/seleniumQuery/wiki/seleniumQuery-and-IE-Driver#protected-mode-exception-while-launching-ie-driver). This is the only way to overcome security limitations when Selenium jar is used. When you don't use Selenium jar, you can enable the `introduceFlakinessByIgnoringProtectedModeSettings` option, but keep in mind that it is reported to cause driver instability.

```javascript
browsers: [{
  browserName: 'ie',
  capabilities: {
    iedriverOptions: {
      introduceFlakinessByIgnoringProtectedModeSettings: 'true'
    },
    ieOptions: {
      addArguments: '-foreground'
    }
  }
}]
```

## Edge
Microsoft Edge requires a WebDriver that is distributed as a native installation. Please make sure you have the correct version installed as explained in [Microsoft Edge WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/). The release version should match the first part of your OS build, for example, for OS build number 15063.0000, choose driver Release 15063. The downloaded driver should be moved to <uiveri5-installation-folder>/selenium/ without renaming.

## Safari
Safari10 includes native webdriver that is bundled with the Safari browser. Please make sure you have enabled it as explained in [Testing with WebDriver in Safari](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari).
At this time, there are no meaningfull `safaridriverOptions` that can be provided under the `safaridriverOptions` key. If you wish to override the `addArguments` anyway, please make sure not to remove the `-legacy` argument as the WebDriverJs version we use requires it.

All Safari options from [Options](https://github.com/SeleniumHQ/selenium/blob/master/javascript/node/selenium-webdriver/safari.js) can be specified under the `safariOptions` key.

The values can be of type string or array of strings.

```javascript
browsers: [{
  browserName: 'safari',
  capabilities: {
    safariOptions: {
      setTechnologyPreview: true
    }
  }
}]
```


