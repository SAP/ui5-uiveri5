exports.config = {
  specResolver: './localSAPUI5SpecResolver',
  localSAPUI5SpecResolver: {
    specsGlob: './specs/*.spec.js', // specRoot: '../openui5/src/{{lib.name}}/test/{{lib.path}}/visual'
    contentRootUri: ""  // contentRootUri: 'testsuite/test-resources/'
    //TODO specs: '*.spec.js'
  }
}
