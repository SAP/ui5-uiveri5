Every library contains one `visual.suite.js` file that enumerates all visual tests.

### File Structure

This diagram shows a visual test folder structure for a `SomeControl` control.

``` wiki
some.lib/
+---test
    +---some/
        +---lib/
            +---SomeControl.html
                visual/
                +---visual.suite.js
                    SomeControl.spec.js
```

### Suite File - NOT IMPLEMENTED YET

Suite file is a node module that is required from the UIVeri5 runtime. It can contain JS code to evaluate some conditions when preparing the list of specs applicable for the run.

Suite with logic:
``` js
module.exports = function(testrunner) {

  testrunner.specs.push('SomeOtherControl.spec.js');

  if(testrunner.runtime.browserName !== 'ie9'){
    testrunner.specs.push('SomeOtherControl.spec.js');
  }
}
```

Simple suite:
``` js
module.exports = [
  'SomeControl.spec.js'
];
```

### Resolving Suites

Each library can contain a `visual.suite.js` file. Libraries are discovered by reading `resources/sap-ui-version.json` of a UI5 app pointed by `baseUrl`.
