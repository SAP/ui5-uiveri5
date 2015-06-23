Every library contains one "visual.suite.js" file that enumerates all visual tests.

### File Structure

This diagram show the folder structure for a visual test for a control "SomeControl".

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

### Suite file

Suite file is actually a node module that is "required" from the visualtest runtime so it could contain JS code to evaluate some conditions when preparing the list of specs applicable for this run.

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

### Resolving suites

Each library could contain a visual.suite.js file. Libraries are discovered by reading resources/sap-ui-version.json of sapui5 app pointed by baseUrl.
