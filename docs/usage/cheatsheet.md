# UIVeri5 API cheatsheet

it uses protractor beneath, so this is a good resource:
http://angular.github.io/protractor/#/api

Notes: 

- Most commands return promises, so you only resolve their values through using jasmine expect API or using `.then(function(){})` syntax.

- Promises are resolved by [WebdriverJS promise manager](https://github.com/angular/protractor/blob/master/docs/control-flow.md#the-webdriver-control-flow) . If you want to schedule non-api made promise into the chain, you have to use one of: 

   - `.then(function(){ <your non-api code> })`
   - [browser.wait()](http://www.protractortest.org/#/api?view=webdriver.WebDriver.prototype.wait)
   - `browser.controlFlow().execute(<promise>)`

- Node 10.15 LTS is used everywhere(jenkins), so async/await syntax can be used. However, beware, control flow may [act a bit weird when await is used:](http://www.protractortest.org/#/control-flow) 
- Feel free to construct promises using `async` keyword though:
```javascript
  it('should sign in', function(){
    ...
    element(by.id('user_name').sendKeys("user1");

    browser.controlFlow().execute(myShinyPromise)

    expect(browser.getTitle()).toBe('Create Correspondence');

  });
});

async function myShinyPromise(){
  console.log('TEST IS HERE')
  return 'something' // if you need promise resolved, not needed if using execute
}
```

Based on this post: https://gist.github.com/javierarques/0c4c817d6c77b0877fda

#### Control browser
```javascript
browser.testrunner.navigation.to('https://XXXXXXXX/', {auth:'plain'}); // Load address, can also use '#yourpage'

browser.sleep(10000); // if your test is outrunning the browser

browser.getLocationAbsUrl() // get the current address

browser.ignoreSynchronization = true; // If true, uiveri5 will not attempt to synchronize with the page before performing actions - make cause wonky behaviour in further tests.
   
```

Here's a trick how to wait for something to become present/visible:

[Expected Conditions](https://www.protractortest.org/#/api?view=ProtractorExpectedConditions)

```javascript

browser.wait(protractor.ExpectedConditions.visibilityOf(element(by.id('create;))), 30000);
   
element(by.id('create')).click();
```

#### Check visibility 

```javascript
element(by.id('create')).isPresent() // Be careful with this: element is often present while it's not displayed...

element(by.id('create')).isEnabled() //Enabled/disabled, as in ng-disabled...

element(by.id('create')).isDisplayed() //Is element currently visible/displayed?
```

#### Find an element by id, model, binding, ...

```javascript
element(by.id('user_name'))

element(by.css('#myItem'))

element(by.control({id: "testID"}); // details: https://github.com/SAP/ui5-uiveri5/blob/master/docs/usage/locators.md#control-locators 

element(by.textarea('person.extraDetails'));

element(by.input('username'));

element(by.input('username')).clear();

element(by.buttonText('Save'));

element(by.partialButtonText('Save'));

element(by.linkText('Save'));

element(by.partialLinkText('Save'));

element(by.css('.class="cssclass"]')); 

var dog = element(by.cssContainingText('.pet', 'Dog'));
```

#### Find collection of elements by css, repeater, xpath..

```javascript
var list = element.all(by.css('.items'))

var list3 = element.all(by.xpath('//div'))

expect(list.count()).toBe(3)

expect(list.get(0).getText()).toBe('First')

expect(list.get(1).getText()).toBe('Second')

expect(list.first().getText()).toBe('First')

expect(list.last().getText()).toBe('Last')
```

#### Send keystrokes, clear

```javascript
element(by.id('user_name').sendKeys("user1");

sendKeys(protractor.Key.ENTER);

sendKeys(protractor.Key.TAB);

element(by.id('user_name')).clear()
```

#### Position and size, also how to deal with promises:

```javascript
element(by.id('item1')).getLocation().then(function(location) {
  var x = location.x;
  var y = location.y;
});

element(by.id('item1')).getSize().then(function(size) {
  var width = size.width;
  var height = size.height;
});
```

#### Jasmine Matchers

https://jasmine.github.io/api/edge/matchers.html

```javascript
to(N­ot)­Be( null | true | false )
to(N­ot)­Equ­al( value )
to(N­ot)­Mat­ch( regex | string )
toBe­Def­ine­d()
toBe­Und­efi­ned()
toBe­Nul­l()
toBe­Tru­thy()
toBe­Fal­sy()
to(N­ot)­Con­tain( string )
toBe­Les­sTh­an( number )
toBe­Gre­ate­rTh­an( number )
toBe­NaN()
toBe­Clo­seTo( number, precision )
toTh­row()
```
