# API Testing
Setting up a test system or providing a consistent data set for a UI test is a challenge. A good pactice is to have self-contained UI tests that prepare the test content themselves, interact with the UI and then assert changes in the system state. Or cleanup the test content so the system is left in a known state.

To do so, the test needs a way to call REST endpoints. Our API testing is insipired by [SuperTest](https://github.com/visionmedia/supertest) but is adapted to the UIVeri5 experience. The request object is a pure [SuperAgent](https://github.com/visionmedia/superagent) request object, adapted with execution flow. No additional methods are provided.

## Synchronization
REST calls are fully synchronized in the execution flow of the UI interactions. There is no need to chain the promises or to work with callbacks.

## Execute a REST Call
```javascript
request.get('http://myapi.dev.hana.ondemand.com/contacts/1').do();
```

## Assert a Result of the Call
```javascript
let res = request.get('http://myapi.dev.hana.ondemand.com/contacts/1').do();
// error response will cause a test failure

// supertest-like assertions
expect(res).toHaveHTTPBody({name: 'something'});        // deep equal, string equal, regexp
expect(res).toHaveHTTPHeader('Content-Type', 'application/json');

// should.js for adavnced body assertions
expect(res).
  body((body) => {
    body.should.have.property('name', 'tj');
  });
```

## Assert on Error Response Code
```javascript
let res = request.get('http://myapi.dev.hana.ondemand.com/contacts/1').do()
    .catch(response => {
        expect(response.status).toBe(401);
        expect(response.body).toMatch(/access denied/);
    });
```

## Save a Result from a Call and Use It in Another Call
```javascript
let contacts;
request.get('http://myapi.dev.hana.ondemand.com/contacts').do()
    .then((res) => {
        contacts = res.body;
        // having this call in the resolve handler is necessary to postpone the URL building till the actual execution time
        request.delete(`http://myapi.dev.hana.ondemand.com/contacts/${contacts[0].id}`).do();
    });
```

# Authentication
Several authentication methods are provided.

## Basic Authentication
To use the build-in basic authentication mechanism, you have to call the `auth()` function and to provide your user and password.
```javascript
request.get(restServiceMockUrl +'/usersWithAuth')
  .auth('<user>','<password>').do();
```

# OData Helpers
Full OData ORM is out of scope but the following samples can simplify basic OData scenarios. For better oData support, please use [TBD]().

# Advanced
## Control Flow
Currently, UIVeri5 is utilising the WebDriverJs concept of control flow. The flow is a sequence of asynchronous function calls, that a dedicated scheduler runs in sequence.

### Synchronize a Promise in the Control Flow
The flow mananager API is based on promises so it is very easy to synchronize a promise in the control flow. With this, subsequence flow operations, such as `element().click()` or `expect()` calls will wait for the promise to be resolved and just then proceed.

````javascript
browser.driver.control.flow(somePromise);
````

## Async/Await
In ES2017 environment, you can decorate the test with async/await and this will make it synchronous e.g. any API calls will synchronize inherently with the execution flow as the flow promises will be awaited. Additional advantage is that you will be able to debug the tests with node debuggers. A disadvantage is that the whole test script should be decorated consistently.
