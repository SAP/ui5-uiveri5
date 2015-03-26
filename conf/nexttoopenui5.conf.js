exports.config = {
  //profile: 'visual', // no need to inherit profile for now
  specResolver: './localSAPUI5SpecResolver',
  localSAPUI5SpecResolver: {
    specsGlob: '../openui5/src/**/test/**/visual/*.spec.js'
    //contentRootUri: 'testsuite/test-resources/'
  }
}
