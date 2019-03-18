/*global request*/
describe('APITesting', function() {
  it('Should check page title', function() {
    expect(element(by.id('page1-title')).getText()).toBe('Hello World');
  });

  it('Should go to second page', function() {
    element(by.id('__button0')).click();
    expect(element(by.id('page2-title')).getText()).toBe('Hello Page 2');
  });

  it('Should make api call and check response body', function() {
    request.get(browser.testrunner.config.params.apiURL+ '/HelloWorldServlet').do()
      .catch(function(responseError) {
        expect(responseError.status).toBe(401);
        expect(responseError.message).toBe('Unauthorized');
      });
  });

  it('Should make api call with auth and check response body', function() {
    var res = request.get(browser.testrunner.config.params.apiURL + '/HelloWorldServlet')
      .auth(browser.testrunner.config.params.user, browser.testrunner.config.params.pass).do();
    expect(res).toHaveHTTPBody({'user':'Hello, ' + browser.testrunner.config.params.user });
  });
});
