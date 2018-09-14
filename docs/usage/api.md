# API testing
Setting up a test system or providing a consistent data set for a UI test is a challange. One good pactice is to have a self-contained UI tests that prepare the test content thmeselves, interact with the UI and then assert changes in the system state. Or cleanup the test content so the system is left in a known state.
To do so, the test need a way to call REST endpoints. Our api testing is insipired by the [SuperTest](https://github.com/visionmedia/supertest) but is adapted to the uiveri5 experience. The request object is a pure [SuperAgent](https://github.com/visionmedia/superagent) request object, adapted with execution flow. No additional methods are provided.

## Synchronization
Rest calls are fully synchronized in the execution flow of the UI interactions. No need to chain the promises or work with callbacks.

## Execute a rest call
```javascript
request.get('http://myapi.dev.hana.ondemand.com/contacts/1');
```

## Assert a result of the call
```javascript
let res = request.get('http://myapi.dev.hana.ondemand.com/contacts/1');
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

## Assert on error response code
```javascript

let res = request.get('http://myapi.dev.hana.ondemand.com/contacts/1')
    .catch(response => {
        expect(response.status).toBe(401);
        expect(response.body).toMatch(/access denied/);
    });
```

## Save result from call and use it in another call
```javascript
let contacts;
request.get('http://myapi.dev.hana.ondemand.com/contacts/1')
    .then((res) => {
        contacts = res.body;
    });

// the arrow function is necesary to postpone the URL building till the actual execution time
request.delete('http://myapi.dev.hana.ondemand.com/contacts/1') => `/contacts/{contacts[0].id}`);
```

# Authentication
Several authentication methods are provided.

## Basic authentication
To use the build-in basic authentication mechanism you have to call `auth()` function and to provide your user and password.
```javascript
request.get(restServiceMockUrl +'/usersWithAuth')
  .auth('<user>','<password>');
```

## OAuth 2
TODO

# OData helpers
Full OData ORM is out of scope but the following samples could simplify basic OData scenarious. For better oData support, please use [TBD]().

## Build odata service url
```javascript
```

# Advanced
## Control Flow
Currently uiveri5 is utilising the webdriverjs concept of control flow. The flow is a sequence of asynchronous function calls, that a dedicated scheduler runs in sequence.

### Synchrnoze a promise in the control flow
The flow mananager API is based on promises so it is very easy to synchrnonze a promise in the control flow. With this, subsequence flow operations like element().click() or expect() calls will wait for the promise to be resolved and just then proceed.

````javascript
browser.driver.control.flow(somePromise);
````

## Async/Await
 In ES2017 environment,the concept of control flow is supported natively with the async/await operators. Async/await operators have a great benefit - make it easy to debug the async executions with browser/node tool. But also have a disadvantage compared to execution flow - the synchrnization is explicit and is responsibility of the test developer. Due to this explicitness, it is not possible to combine flow manager and async/await transparently, the app/test should explicitly synchronize on the interaction points.

### Execute async/await code before flow manager code

### Execute flow manager code before async/await code
