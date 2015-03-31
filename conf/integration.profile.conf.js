exports.config = {
  specResolver: './localSAPUI5SpecResolver',
  localSAPUI5SpecResolver: {
    contentRootUri: ""  // contentRootUri: 'testsuite/test-resources/'
  },
  specs: './*.spec.js' // specs: '../openui5/src/**/test/**/visual/*.spec.js';
}
