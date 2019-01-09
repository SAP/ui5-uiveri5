exports.config = {
  provider: 'name',
  multi: [
    {name: 'option1'}
  ],
  test: {
    key: {
      param: 'sap-ui-theme=sap_${parameters.test}',
      secondParam: "sap-ui-rtl=${parameters.rtl === 'rtl'}"
    }
  }
};
