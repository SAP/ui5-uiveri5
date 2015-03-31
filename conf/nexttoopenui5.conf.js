exports.config = {
  //profile: 'visual', // no need to inherit profile for now
  specResolver: './localSAPUI5SpecResolver',
  localSAPUI5SpecResolver: {
    //contentRootUri: 'testsuite/test-resources/'
  },
  specs: '../openui5/src/**/test/**/visual/*.spec.js'
}
