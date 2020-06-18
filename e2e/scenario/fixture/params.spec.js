describe('params', function () {
  it('should have imported params', function () {
    expect(browser.testrunner.config.params.param_1).toBe('param from file');
    expect(browser.testrunner.config.params.param_2).toBe('param from cli');
  });

  it('should export params', function () {
    expect(Object.keys(browser.testrunner.config.exportParams).length).toBe(0);
    browser.testrunner.config.exportParams.new_param = 'exported param';
    browser.testrunner.config.exportParams.param_1 = browser.testrunner.config.params.param_1 + ' - changed';
    expect(browser.testrunner.config.params.param_1).toBe('param from file');
  });
});
