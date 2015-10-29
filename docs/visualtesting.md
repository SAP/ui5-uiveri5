### Basic requirements
Only one describe() block with name <lib>.<SpecName>
No browser.get()

### Examples

#### Run against android emulator
Start appium
```
$ appium --device-name=android
```
Execute the visual test
```
$ grunt visualtest --browsers=browser:*:android --seleniumAddress=http://127.0.0.1:4723/wd/hub --baseUrl=http://10.0.2.2:8080
```
___Limitation___ Currently screenshots are not supported on default browser on android emulator so disable
them with --take=false

### Advanced

#### Override reference image storage for local image storage case
When localStorageProvider is used, by default the reference images are stored in the source tree, parallel to the
the tests in a subfolder 'visual'. This is fine if you plan to submit the images in git as part of the test.
In central visual test execution usaces, it could be useful to store the reference images in a separate folder,
outside ot the source tree. Configure the required folder in your conf.js like this:
```javascript
storageProvider: {name: './image/localStorageProvider',refImagesRoot: '../../storage'}
```

