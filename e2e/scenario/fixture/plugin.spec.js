describe('plugin', () => {
  browser.logger.info('Plugin: describe block');

  it('show page - first', () => {
    browser.logger.info('Plugin: first it block');
    expect(browser.getTitle()).toBe('E2E Test');
  })

  it('show page - second', () => {
    browser.logger.info('Plugin: second it block');
    expect(browser.getTitle()).toBe('E2E Test');
  })
});
