# Locators

## What to prefer
Always work on the highest level of abstraction that is possible in the specific case. 
* Prefer control selectors instead of DOM-level selecto. 
* Prefer ID selectors if you have manually assinged IDs. 
* Prefer hierarchical class selectors but avoid layout-specific classes and try to stick to semantical classes.

__Try to compose the selector as if you are explaining a manual tester where to click.__

## What to avoid

### Avoid ID selectors using generated IDs
Selection a DOM element by ID is the simplest and widely used approach in classical web site testing.
The classical web page is composed manually and so the important elements are manually assigned nice
and meaningful IDs. So it is easy to identify those elements in automatic tests.
But in highly-dynamic JS frameworks like SAPUI5 the DOM is generated out of the views. The views could
also be generated from the content meta-information. Very often, IDs are not assigned by a developer during application
creation. In such cases, the ID is generated in runtime from the control name and a suffix that is the sequential number
of this control in this app. The generated ID could also could contain prefix of the enclosing view, like "__xmlview1".
In this scheme, the leading "__" mean "internal and generated, not to be relied on"
There are several problems with using such generated IDs in application tests.
1. IDs are stable between application runs but are generated and will definitely change when the application is modified.
Even minor unrelated change like adding one more button in some common area like header could cause a change of
all IDs. This will require changes in all selectors used in all tests for this application.
2. This is even more probable with metadata-driven UIs like Fiori Elements. The fiori elements template could change with a UI5 minor version upgrade and could introduce  new visual elements that will also change the generated IDs of the rest.
3. IDs are execution-unique and are generated on the runtime. So repetitive ID's require repetitive navigation path
in the application. This makes it especially hard for a human to develop and support the test as manual reproduction would require to always start from the begining and pass over the whole test. It is also impossible to execute only part of the whole scenario by using disabled or focused specs and suites.
4. The generated IDs could be different depending on the environment the application is running.
5. Generated IDs are totally not self-documenting and this makes the test harder to understand and maintain.

### Avoid non-visible attributes
Think from the point of view of the users. Users do not see DOM nodes and their attributes but see rendered DOM.
So write selectors that include only "visible" attributes.
This also makes the test much self-documenting and simplifies maintenance.

### Minimize use of attribute locators
These locators are slow and are usually not closely related to the visual representation. Besides, attribute values may often change and may not be specific enough if used on their own.

## DOM locators
All standart locators from webdriverjs are supported, please check webdirvejs docs for references.

## UIVeri5 locators

### JQuery
SAPUI5 runtime include and heavily use jquery so we bridge the power of jquery to application tests.
All [jquery selectors](https://api.jquery.com/category/selectors/) are available,including the powerful pseudo-selectors.
Select an element by jquery expression:
```javascript
element(by.jq('<jguery expression>'));
```

#### Select and element that contain specific child
Sometimes it is useful to have a backward selectors e.g. select the parent of an element with specific properties.
This is easily achieved with jquery [:has()](https://api.jquery.com/has-selector/) pseudo-selector.
Select a tile from Fiori Launchpad:
```javascript
element(by.jq('.sapUshellTile:has(\'.sapMText:contains(\"Track Purchase Order\")\')'))
```

#### Select an element from list
Protractor ElementArrayFinder that is returned from element.all() has a .get(<index>) method that will return
an element by its index. But chaining several levels of .get() could slowdown the test execution as every
interaction requires a browser roundtrip. Additionally whole expression becomes cumbersome and hard to read.
Much simpler is to use the jquery [:eq()](https://api.jquery.com/eq-selector/) pseudo-selector.
```javascript
element(by.jq('.sapMList > ul > li:eq(1)')),
```

### Control locator
In order to use `control` locator in your tests, the application under test must use a certain version of UI5. All versions newer than 1.55 are acceptable, as well as all patches of 1.52 and 1.54 after and including 1.52.12 and 1.54.4.

In the application testing approach we use hierarchical class locators composed of UI5 control main
(marker) class names (the class names of the control root DOM element). This hierarchical composition is important to guarantee the stability of locators. But the usage of classes is somehow problematic as DOM is not UI5 API and DOM could change between UI5 minor releases. Only UI5 JS API is guaranteed to be backward-compatible. One approach to mitigate this issue is to use control locators.

The `control` locator is closely tied to the control level of abstraction and therefore should be much more intuitive for application developers. The `control` locator object can be written easily by inspecting the application using [UI5 Inspector](https://chrome.google.com/webstore/detail/ui5-inspector/bebecogbafbighhaildooiibipcnbngo).

The locator is created using the `by` collection of factory functions:
```javascript
element(by.control({id: "testID"});
// or to find multiple elements:
element.all(by.control({id: /test/});
```

Using `control` locator will give you an `ElementFinder` of the DOM element best representing the found control. Since there can be more than one representation of a control, you can choose which one best fits a desired interaction. This is a common pitfall and is described below in the Interactions section.

#### Syntax
Under the hood, control locators rely on [OPA5](https://openui5.hana.ondemand.com/#/api/sap.ui.test.Opa5/overview) functionality. If you are familiar with OPA5's `waitFor` structure, then you will be able to immediately transition to control locators. The difference between a control selector and a typical OPA5 `waitFor` is that some values are not allowed. The unsupported property values are: `matchers` and `actions` object constructions and `check`, `success` and `actions` functions.

`by.control` accepts a plain object specifying the viewName, viewNamespace, ID, controlType, ID suffix, and other properties of the control to look for. The ID can be a string or regular expression. Just like in OPA5, if a viewName is given, the ID is the view-relative ID, otherwise it is the global ID. For most [OPA5 matchers](https://openui5.hana.ondemand.com/#/api/sap.ui.test.matchers/overview) there is a corresponding selector property. Currently the supported matchers are: `aggregationContainsPropertyEqual`, `aggregationEmpty`, `aggregationFilled`, `aggregationLengthEquals`, `bindingPath`, `I18NText`, `labelFor`, `properties`, `propertyStrictEquals`. In OPA5 you normally create a matcher instance and pass the expected parameters to the constructor as a plain object. In a control selector, you can set the same plain object parameters to the matcher property.

Matchers syntax:
```javascript
// find an object header with full ID matching "myViewID--foo.[0-9]+" and property data binding for model "JSONModel"
element(by.control({
  id: /^foo.[0-9]+/,
  viewName: "myViewName",
  controlType: "sap.m.ObjectHeader",
  bindingPath: {path: "/products/1", propertyPath: "Status", modelName: "JSONModel"}
});
// other examples of matcher properties:
  I18NText: {propertyName: "text", key: "buttonText"}
  labelFor: {key: "labelText", modelName: "i18n"}
  labelFor: {text: "myText"}
  properties: {text: "My Header Text"}
  aggregationContainsPropertyEqual: {aggregationName: "myAggregation", propertyName: "enabled", propertyValue: true}
  aggregationLengthEquals: {name: "myAggregation", value: 1}
  aggregationEmpty: {name: "myAggregation"}
  aggregationFilled: {name: "myAggregation"}
```

Multiple uses of one type of matcher in a single selector:
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

#### Interaction adapters
A control DOM tree may include multiple interactable DOM elements. If you need to interact with a specific DOM element of this tree, use an interaction adapter. Interaction adapters are inspired by [Opa5 press adapters](https://openui5.hana.ondemand.com/#/api/sap.ui.test.actions.Press). You specify an adapter using the `interaction` property of the by.control object. The interaction can be any one of: `root`, `focus`, `press`, `auto`, `{idSuffix: "myIDsuffix"}`. the Default is `auto`. This is what the located element will be in each case:
* root: the root DOM element of the control
* focus: the DOM element that should typically get the focus
* press: the DOM element that should get the press events, as determined by OPA5
* auto: the DOM element that should receive events, as determined by OPA5. This would search for special elements with the following priority: press, focus, root.
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

Another use case would be controls like ObjectIdentified or ObjectAttribute that could have different aappearance and have OPA interaction adapters. The default `auto` interaction would use the interaction adapter to find the DOM. But if the control is not in the expected apearance and due to the hardcoded interaction adapter type order, it is possible that the search will fail with a message like: _INFO: Expectation FAILED: Failed: unknown error: Control Element sap.m.ObjectAttribute#\_\_attribute0 has no dom representation idSuffix was text_. The you need to overide the intercation type and search for a focused element:
```javascript
var objectAttributeText = element(by.control({
  controlType: "sap.m.ObjectAttribute",
  interaction: "focus",
  properties: [{
    title: "Freight RFQ"
  }]
})); // will locate the text inside this ObjectAttribute
```

#### Control ancestors
When you use a control locator to find a child element of a specific parent, IUVeri5 will apply the [ancestor matcher](https://openui5.hana.ondemand.com/#/api/sap.ui.test.matchers.Ancestor) to the child. The parent element's control ID is used to find child controls. For example, if the parent is a header bar, its control's root element will be the header, so if you then search for child elements, the other header bars might match as well.  Example:
```javascript
element(by.id("page1-intHeader-BarLeft")) // can be any locator
  .element(by.control({
    controlType: "sap.m.Button"
  })); // will look for buttons in the header
```
