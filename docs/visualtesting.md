### Basic requirements
Only one describe() block with name <lib>.<SpecName>
No browser.get()

### Advanced

#### Override reference image storage for local image storage case
When localStorageProvider is used, by default the reference images are stored in the source tree, parallel to the
the tests in a subfolder 'visual'. This is fine if you plan to submit the images in git as part of the test.
In central visual test execution usaces, it could be useful to store the reference images in a separate folder,
outside ot the source tree. Configure the required folder in your conf.js like this:
```javascript
localStorageProvider: {
    refImagesRoot: '../../storage'
  }
```
