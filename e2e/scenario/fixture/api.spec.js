describe('api', function() {
  var restServiceMockUrl = browser.testrunner.config.params.apiUrl;

  it('Should make api call and verify response', function() {
    // execute the request without being interested in the success response
    request.get(restServiceMockUrl +'/users').do();

    // execute the request and handle the response
    request.get(restServiceMockUrl +'/users').do().then(function (res){
      expect(res.status).toBe(200);
    });
  });

  it('Should handle errors', function() {    
    // unhandled errors will break the test 
    browser.controlFlow().execute(function() {
      request.get(restServiceMockUrl +'/notFound').do();
    }).catch((error) => {
      expect(error.status).toBe(404);
    });

    // we can handle the error and the test will continue
    request.get(restServiceMockUrl +'/notFound').do().catch(function (error){
      expect(error.status).toBe(404);
    });
  });
  
  it('Should make api call and check response body', function() {
    var res = request.get(restServiceMockUrl +'/users').do();
    expect(res).toHaveHTTPBody([{user1: 'testUser1'},{user2: 'testUser2'}]);
  });
  
  it('Should make api call and check response header', function() {
    var res = request.get(restServiceMockUrl +'/users').query({ user: 'user1'}).do();
    expect(res).toHaveHTTPHeader(['Content-Type', 'application/json']);
  });

  it('Should make post api call and check response', function() {
    var res = request.post(restServiceMockUrl +'/users')
      .send({"name": "morpheus", "job": "leader"})
      .set('accept', 'json')
      .do();
    expect(res).toHaveHTTPHeader(['Content-Type', 'application/json']);
    expect(res).toHaveHTTPBody({status: 'done'});
  });

  it('Should make delete api call and check response header', function() {
    var res = request.delete(restServiceMockUrl +'/users/user1').do();
    expect(res).toHaveHTTPBody({deleted: 'user1'});
  });

  it('should schedule requests in proper order', function() {
    var first = request.get(restServiceMockUrl +'/user').do();
    var second = request.get(restServiceMockUrl +'/user').do();

    expect(first).toHaveHTTPBody({result: 2});
    expect(second).toHaveHTTPBody({result: 3});
  });

  it('should schedule requests in proper order with timeouts', function() {
    var first = request.get(restServiceMockUrl +'/users').query({delay: 2000}).do();
    var second = request.get(restServiceMockUrl +'/users').query({delay: 1000}).do();

    expect(first).toHaveHTTPBody({result: '2000'});
    expect(second).toHaveHTTPBody({result: '1000'});
  });

  it('should check property of response body', function() {
    var res = request.get(restServiceMockUrl +'/user');
    expect(res).body((body) => {
      // full range of shouldjs assertions are supported
      body.should.have.property('result').which.is.a.Number();
    });
  });

  it('Should authenticate and check the response', function() {
    var res = request.get(restServiceMockUrl +'/usersWithAuth').auth('testUser','testPass');
    expect(res).toHaveHTTPBody({status: 'Authenticated'});
  });
  
});
