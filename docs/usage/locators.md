# Locators

## What to Prefer
Always work on the highest level of abstraction that is possible in the specific case. 
* Prefer control locators instead of DOM-level locators. 
* Prefer ID selectors if you have manually assinged IDs. 
* Prefer hierarchical class selectors but avoid layout-specific classes and try to stick to semantical classes.

__Try to compose the selector as if you are explaining to a manual tester where to click.__

## What to Avoid

### Avoid ID Locators that Use Generated IDs
Selection of a DOM element by ID is the simplest and most widely used approach in classical website testing.
The classical web page is composed manually. This way the important elements are assigned nice and meaningful IDs so it is easy to identify those elements in automatic tests.

In highly-dynamic JS frameworks, such as SAPUI5, the DOM tree is generated out of the views. The views can
also be generated from the content meta information. Very often, IDs are not assigned by a developer during application
creation. In such cases, the ID is generated in runtime from the control name with a suffix that is the sequential number
of this control in the app. The generated ID can also contain prefix of the enclosing view, such as `__xmlview1`.
In this scheme, the leading "__" means "internal and generated, not to be relied on".

There are several problems with using such generated IDs in application tests:

1. IDs are stable between application runs but are generated and will definitely change when the application is modified.
Even minor unrelated change, such as adding one more button in some common area like the header can cause a change of
all IDs. This will require changes in all selectors used in all tests for this application.
2. A change of IDs is even more probable with metadata-driven UIs, such as SAP Fiori Elements. The SAP Fiori Elements template can change with a UI5 minor version upgrade and can introduce new visual elements that will also change the generated IDs of the rest.
3. IDs are execution-unique and are generated on the runtime. So repetitive ID's require repetitive navigation path
in the application. This makes it especially hard for a human to develop and support the test as manual reproduction requires to always start from the beginning and pass over the whole test. It is also impossible to execute only part of the whole scenario by using disabled or focused specs and suites.
4. The generated IDs can be different depending on the environment the application is running on.
5. Generated IDs are not self-documenting and this makes the test harder to understand and maintain.

### Avoid Non-visible Attributes
Have in mind the point of view of the users. Users do not see DOM nodes and their attributes but see rendered DOM.
So, write selectors that include only "visible" attributes.
This also makes the test more self-documenting and simplifies maintenance.

### Minimize Use of Attribute Locators
These locators are slow and are usually not closely related to the visual representation. Besides, attribute values may often change and may not be specific enough if used on their own.

## Control Locators
In order to use the `control` locator in your tests, the application being tested must use a certain version of UI5. All versions newer than 1.54 are acceptable, as well as all patches of version 1.52 and 1.54 after and including 1.52.12 and 1.54.4.

In the application testing approach we use hierarchical class locators composed of UI5 control main
(marker) class names (the class names of the control root DOM element). This hierarchical composition is important to guarantee the stability of locators. Usage of classes is problematic as DOM is not a UI5 API and it can change between UI5 minor releases. Only UI5 JS API is guaranteed to be backward-compatible. One approach to mitigate this issue is to use control locators.

The `control` locator is closely tied to the control level of abstraction and therefore should be much more intuitive for application developers.

The locator is created using the `by` collection of factory functions:
```javascript
element(by.control({id: "testID"}));
// or to find multiple elements:
element.all(by.control({id: /test/}));
```

Using the `control` locator gives you an `ElementFinder` of the DOM element best representing the found control. Since there can be more than one representation of a control, you can choose which one fits best a desired interaction. This is a common pitfall and is described below in the Interactions section.

### Tools
As of version 1.74, UI5 provides the [Test Recorder tool](https://openui5.hana.ondemand.com/topic/2535ef9272064cb6bd6b44e5402d531d)
which supports application developers who write integration and system tests. Use it in your application under test to get hints
on writing tests and suggestions for control locators. The Test Recorder provides UIVeri5 code snippets for most controls.
Keep in mind that this tool is just a helper and you would often have to modify the snippets to fit your specific needs!

In the Test Recorder you can inspect control properties to write your own snippets from scratch. There are a couple of other tools
that can also help you inspect the control tree:
* [UI5 Technical Information](https://openui5.hana.ondemand.com/topic/616a3ef07f554e20a3adf749c11f64e9#loio616a3ef07f554e20a3adf749c11f64e9)
* [UI5 Diagnostics](https://openui5.hana.ondemand.com/topic/6ec18e80b0ce47f290bc2645b0cc86e6#loio790defe9ff8643bf8629c8567270e290)
* [UI5 Inspector](https://chrome.google.com/webstore/detail/ui5-inspector/bebecogbafbighhaildooiibipcnbngo)

### Syntax
Under the hood, control locators rely on [OPA5](https://openui5.hana.ondemand.com/#/api/sap.ui.test.Opa5/overview) functionality. If you are familiar with OPA5's `waitFor` structure, then you will be able to immediately transition to control locators. The difference between a control selector and a typical OPA5 `waitFor` is that some values are not allowed. The unsupported property values are: `matchers` and `actions` object constructions and `check`, `success` and `actions` functions.

`by.control` accepts a plain object specifying the `viewName`, `viewNamespace`, ID, `controlType`, ID suffix, and other properties of the control to look for. The ID can be a string or a regular expression. Just like in OPA5, if a `viewName` is given, the ID is the view-relative ID, otherwise it is the global ID.

All [OPA5 matchers](https://openui5.hana.ondemand.com/#/api/sap.ui.test.matchers/overview) are supported. In OPA5, you normally create a matcher instance and pass the expected parameters to the constructor as a plain object. In a control selector, you can set the same plain object parameters to the matcher property.

The syntax for each matcher is detailed in the [API](https://openui5.hana.ondemand.com/api/), for example see [the binding path matcher's API](https://openui5.hana.ondemand.com/api/sap.ui.test.matchers.BindingPath). Here are some examples:

```javascript
// find an object header with full ID matching "myViewID--foo.[0-9]+" and property data binding for model "JSONModel"
element(by.control({
  id: /^foo.[0-9]+/,
  viewName: "myViewName",
  controlType: "sap.m.ObjectHeader",
  bindingPath: {path: "/products/1", propertyPath: "Status", modelName: "JSONModel"}
});
// other examples of matcher properties:
  i18NText: {propertyName: "text", key: "buttonText"}
  labelFor: {key: "labelText", modelName: "i18n"}
  labelFor: {text: "myText"}
  properties: {text: "My Header Text"}
  aggregationContainsPropertyEqual: {aggregationName: "myAggregation", propertyName: "enabled", propertyValue: true}
  aggregationLengthEquals: {name: "myAggregation", length: 1}
  aggregationEmpty: {name: "myAggregation"}
  aggregationFilled: {name: "myAggregation"},
  ancestor: {id: /^foo/, properties: {text: "My Ancestor Text"}},
  descendant: {id: /^bar/, properties: {text: "My Descendant Text"}}
```

You can use the same matcher multiple times in a single selector:
```javascript
element(by.control({
  viewName: "myViewName",
  controlType: "sap.m.ObjectHeader",
  aggregationFilled: [
    {name: "myAggregation"},
    {name: "myOtherAggregation"}
  ]
}))
```

### Interaction adapters
A control DOM tree may include multiple interactable DOM elements. If you need to interact with a specific DOM element of this tree, use an interaction adapter.

Interaction adapters are inspired by Opa5 [press](https://openui5.hana.ondemand.com/#/api/sap.ui.test.actions.Press) adapters. You specify an adapter by using the `interaction` property of the by.control object.

The interaction can be any one of: `root`, `focus`, `press`, `auto` (default), and `{idSuffix: "myIDsuffix"}`.

Located element for each case:
* root: the root DOM element of the control
* focus: the DOM element that typically gets the focus
* press: the DOM element that gets the `press` events, as determined by OPA5
* auto: the DOM element that receives events, as determined by OPA5. It searches for special elements with the following priority: press, focus, root.
* {idSuffix: "myIDsuffix"}: child of the control DOM reference with ID ending in "myIDsuffix"

One common use case for changing the adapter is locating search fields:
```javascript
var searchInput = element(by.control({
  controlType: "sap.m.SearchField",
  interaction: "focus"
}); // will locate the input field
var searchPress = element(by.control({
  controlType: "sap.m.SearchField",
  interaction: "press"
}); // will locate the search button (magnifier)
```

Another use case is for controls, such as `ObjectIdentifier` or `ObjectAttribute` that can have different appearance and OPA interaction adapters. The default `auto` interaction uses the interaction adapter to find the DOM.

If the control is not in the expected apearance and due to the hard-coded interaction adapter type order, it is possible that the search to fail with a message, such as: _INFO: Expectation FAILED: Failed: unknown error: Control Element sap.m.ObjectAttribute#\_\_attribute0 has no dom representation idSuffix was text_.

In this case, you need to override the intercation type and search for a focused element:
```javascript
var objectAttributeText = element(by.control({
  controlType: "sap.m.ObjectAttribute",
  interaction: "focus",
  properties: [{
    title: "Freight RFQ"
  }]
})); // will locate the text inside this ObjectAttribute
```

### Control Ancestors
When you use a control locator to find a child element of a specific parent, UIVeri5 applies the [ancestor matcher](https://openui5.hana.ondemand.com/#/api/sap.ui.test.matchers.Ancestor) to the child. The ID of the parent element is used to find child controls. For example, if the parent is a header bar, its control's root element is the header. If you then search for child elements, the other header bars might match as well.

Example:
```javascript
element(by.id("page1-intHeader-BarLeft")) // can be any locator
  .element(by.control({
    controlType: "sap.m.Button"
  })); // will look for buttons in the header
```

You can explicitly declare an ancestor or descendant using the common matchers syntax. In this case, the ancestor (or descendant) is declared as a plain object, which can contain any combination of matchers.
Essentially, the ancestor (descendant) object is another control selector used in recursion.
Ancestors (and descendants) can be nested and they can include other ancestor (or descendant) matchers themselves.

Example:
```javascript
// looks for a link with specific text, then finds its parent header bar
// and finally finds all buttons in that header bar (all siblings of the link, which are of type Button)
element(by.control({
  controlType: "sap.m.Button",
  ancestor: {
    id: /BarLeft/,
    descendant: {
      controlType: "sap.m.Link",
      properties: {text: "Sibling"}
    }
  }
}));
```

### Interactable, Visible, Enabled
In contrast to OPA5 (with enabled autoWaiter), the control locator in UIVeri5 will find controls even if they are not visible, not enabled or not interactable. This is a basic limitation, comming from the fact that "auto waiting" in UIVeri5 is global and happens before the element location. To limit the search to visible controls, add `visible: true', to limit to enabled controls add 'enabled: true' and to limit to interactable controls add 'interactable: true'. The interactable check is the most extensive, it makes sure that the control is visible on the screen, there is no busy indicator on this control or any of its parents, the control is not scheduled for rerendering and
is not hidden behind a blocking layer of an opened dialog.
It is not necessary to add interactable flag to every selector as UIVeri5 synchronization will prevent serching in 
a page that is not ready and is still rendering. Add the flag only when you face exceptions like "WebDriverError: element click intercepted ..."

```javascript
element(by.control({
  id: 'myButton',
  viewName: 'myView',
  interactable: true
}));
```

## DOM Locators
All standart `by.` locators from [WebDriverJs](https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_By.html) are supported.

## JQuery Locators
SAPUI5 runtime includes and uses jQuery to bridge its power to application tests.

All [jQuery selectors](https://api.jquery.com/category/selectors/) are available, including the powerful pseudo-selectors.

Select an element by jQuery expression:
```javascript
element(by.jq('<jguery expression>'));
```

### Select an Element that Contains a Specific Child
Sometimes, it is useful to have a backward selectors, for example, to select the parent of an element with specific properties.

This is easily achieved with the [:has()](https://api.jquery.com/has-selector/) jQuery pseudo-selector.

Select a tile from SAP Fiori Launchpad:
```javascript
element(by.jq('.sapUshellTile:has(\'.sapMText:contains(\"Track Purchase Order\")\')'))
```

### Select an Element from a List
`ElementArrayFinder` that is returned from `element.all()` has a `.get(<index>)` method that returns
an element by its index. However, chaining several levels of `.get()` can slowdown the test execution as every
interaction requires a browser roundtrip. Additionally, the whole expression becomes cumbersome and hard to read.

It is more simple to use the [:eq()](https://api.jquery.com/eq-selector/) jQuery pseudo-selector.
```javascript
element(by.jq('.sapMList > ul > li:eq(1)')),
```
