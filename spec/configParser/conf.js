exports.config = {
  provider1: 'name',
  provider2: {key1: 'overwrite', key2: 'overwrite'},
  specs: ['overwrite'],
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
    browserName: 'chromeHeadless'
  }],
  params: {
    param1: "test",
    param2: "test2",
    param3: "test3"
  }
};
