# Test organization

## Specs
You can decide which specs to run for every config profile and for each execution.
Spec files can also be grouped in suites, which is useful for large projects.
In the following points, a spec means a single jasmine suite defined in a single file,
and a suite means a group of specs (or a group of jasmine suites).
A spec should be declared by its jasmine suite name (the file name without the `spec.js` suffix).

### Default set of specs
You can choose a base set of specs in the config file with the `specs` property.
It accepts a string glob or an array of globs. The default value is ['./*.spec.js']
Each test execution runs a subset of these specs, depending on the command line parameters.
```javascript
specs: [
  './*.spec.js',
  '*spec1.spec*'
]
```
### Spec filtering
To execute an exact set of specs, add their names as a comma separated list in the `specFilter`
command line property. This will run only the specs that are in this list and match the `specs` configuration.
```console
  uiveri5 --v --specFilter=main,detail,todo
```

To exclude a set of specs, add their names as a comma separated list in the `specExclude`
command line property. All available specs will be run, except the ones in this list.
```console
  uiveri5 --v --specExclude=main,detail,todo
```

## Suites
Since v1.42.0 specs can be organized in suites. If the `specs` value is an object, it is assumed to
define suites, or groups of specs. Each key is the name of a suite.
Each value is a glob or array of globs for the spec files of the suite.
```javascript
specs: {
  mainSuite: './*main.spec.js',
  detailSuite: [
    './detail.spec.js',
    './todo.spec.js'
  ],
  other: '*-test.spec.js'
}
```

### Suite filtering
Once the specs are grouped, you can run a different group on each run.

To execute an exact set of suites, add their names as a comma separated list in the `suiteFilter`
command line property. This will run only the suites that are in this list.
```console
  uiveri5 --v --suiteFilter=mainSuite,detailSuite
```

To exclude a set of suites, add their names as a comma separated list in the `suiteExclude`
command line property. All available suites will be run, except the ones in this list.
```console
  uiveri5 --v --suiteExclude=detailSuite,other
```
