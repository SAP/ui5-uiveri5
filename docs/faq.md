
### Start browser maximized:
Add options to browser capabilities:
```json
  browsers: [{
    browserName: 'chrome',
    chromeOptions: {
      args: ['start-maximized']
    }}
  ]
```
or in test:
```javascript
browser.driver.manage().window().maximize()
```
