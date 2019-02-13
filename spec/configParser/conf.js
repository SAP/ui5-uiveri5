exports.config = {
  provider: 'name',
  multi: [
    {name: 'option1'}
  ],
  key1: [{key2: 'changeme'}],
  test: {
    key: {
      param: 'sap-ui-theme=sap_${parameters.test}',
      secondParam: "sap-ui-rtl=${parameters.rtl === 'rtl'}"
    }
  },
  browsers: [{
    browserName: 'chrome'
  }]
};
