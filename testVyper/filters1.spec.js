/* eslint-disable no-undef */

var ui5ControlConverter = require("../../ui5ControlConverter");

/*
1) Test standard properties
2) Test new properties adding from ui5 api
3) Test with removing empty properties
4) Testing with binding path/bindingContextPath
4a) Testing with binding path/context on prec,next, parent element
5) Testing with i18nText
5a) Testing with i18nText on prec,next, parent element
6) Testing with boolean, number properties
7) Test with empty values, wrong property names, wrong metadata
8) Test with index
9) Test with aggregation bindings
10) Test with ancestors
11) Test with bindingpath aggregations
12) Test with chaining of elements
13) Test view Id & Name
14) Test read UI Control and all properties immidietaly
15) Test dom properties
16) Test descentor/child properties
17) Test assertions
 */

describe("filters1", function () {

  it("step0v1: check Page has descendant text - wait for property only not element", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Page","mProperties":{
        "id": "container-cart---welcomeView--page"}
      },
      "descendantProperties": {"metadata": "sap.m.Text", "mProperties": {
        "text":[{"path": "i18n>welcomeCarouselShipping"}]
      }}
    };
    await ui5.common.assertion.expectAttributeToBe(ui5ControlProperties, "showHeader", "true", 0, 1, 30000);
  });

  it("step0v1: check Page has empty descendant button", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Page","mProperties":{
        "id": "*welcomeView--page"}
      },
      "descendantProperties": {}
    };
    await ui5.common.assertion.expectAttributeToBe(ui5ControlProperties, "showHeader", "true", 0, 30000, 10000);
  });

  it("step0v1: check Page has descendant text", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Page","mProperties":{
        "id": "container-cart---welcomeView--page"}
      },
      "descendantProperties": {"metadata": "sap.m.Text", "mProperties": {
        "text":[{"path": "i18n>welcomeCarouselShipping"}]
      }}
    };
    await ui5.common.assertion.expectAttributeToBe(ui5ControlProperties, "showHeader", "true", 0, 30000, 10000);
  });

  it("step0v1: check Page has descendant button", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Page","mProperties":{
        "id": "*welcomeView--page"}
      },
      "descendantProperties": {"metadata": "sap.m.Button", "mProperties": {
        "tooltip":[{"path": "i18n>avatarButtonTooltip"}]
      }}
    };
    await ui5.common.assertion.expectAttributeToBe(ui5ControlProperties, "showHeader", "true", 0, 30000, 10000);
  });

  it("step0v1: check Page has wrong descendant text", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Page","mProperties":{
        "id": "container-cart---welcomeView--page"}
      },
      "descendantProperties": {"metadata": "sap.m.Text", "mProperties": {
        "text":[{"path": "welcomeCarouselShippings1"}]
      }}
    };
    try {
      await common.locator.getDisplayedElement(ui5ControlProperties, 0, 5000);
      await expect(true).toBe(false);
    } catch (error) {
      await expect(true).toBe(true);	
    }
  });

  it("step0v1: check Page has not direct childern text control", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Page","mProperties":{
        "id": "container-cart---welcomeView--page"}
      },
      "childProperties": {"metadata": "sap.m.Text", "mProperties": {
        "text":[{"path": "i18n>welcomeCarouselShipping"}]
      }}
    };
    try {
      await common.locator.getDisplayedElement(ui5ControlProperties, 0, 5000);
      await expect(true).toBe(false);
    } catch (error) {
      await expect(true).toBe(true);	
    }
  });

  it("step0v1: check Page has not direct children button control", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Page","mProperties":{
        "id": "container-cart---welcomeView--page"}
      },
      "childProperties": {"metadata": "sap.m.Button", "mProperties": {
        "tooltip":[{"path": "i18n>avatarButtonTooltip"}]
      }}
    };
    try {
      await common.locator.getDisplayedElement(ui5ControlProperties, 0, 5000);
      await expect(true).toBe(false);
    } catch (error) {
      await expect(true).toBe(true);	
    }
  });

	

  it("step0v1: check name is Accessories - check with dom properties", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "cont*cart*", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"},
      "domProperties": {
        "nodeName": "li",
        "data-sap-ui": "*categoryList-0",
        "role": "option",
        "class": "*sapMLIB*sapMSLI",
        "id": "__item1-container-cart---homeView--categoryList-0"
      }
      }
    };
    await common.locator.getDisplayedElement(ui5ControlProperties);
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);
  });

  it("step0v1: check name is Accessories - check with dom properties nodename and id", async function () {
    await browser.sleep(5000);
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem",
        "domProperties": {
          "nodeName": "li",
          "id": "*categoryList-0"
        }
      }
    };
    await common.locator.getDisplayedElement(ui5ControlProperties);
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);
  });

  it("step0v1: check name is Accessories - check with wrong dom properties", async function () {
    await browser.sleep(5000);
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "cont*cart*", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"},
      "domProperties": {
        "nodeName": "li",
        "data-sap-ui": "*categoryList-0",
        "role": "option1",
        "class": "*sapMLIB*sapMSLI",
        "id": "__item1-container-cart---homeView--categoryList-0"
      }
      }
    };
    try {
      await common.locator.getDisplayedElement(ui5ControlProperties, 0, 5000);
      await expect(true).toBe(false);
    } catch (error) {
      await expect(true).toBe(true);	
    }
  });

  it("step0v1: check name is Accessories - check with wrong dom properties", async function () {
    await browser.sleep(5000);
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "cont*cart*", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"},
      "domProperties": {
        "nodeName": "li",
        "data-sap-ui": "*categoryList-0",
        "role": "option",
        "class": "*sapMLIB1*sapMSLI",
        "id": "__item1-container-cart---homeView--categoryList-0"
      }
      }
    };
    try {
      await common.locator.getDisplayedElement(ui5ControlProperties, 0, 5000);
      await expect(true).toBe(false);
    } catch (error) {
      await expect(true).toBe(true);	
    }
  });
 
  it("check getDisplayedChildElement 1", async function(){
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.List","mProperties":{"items":[{"path":"/ProductCategories"}]}},
      "parentProperties":{"metadata":"sap.m.Page","mProperties":{"title":[{"path":"i18n>homeTitle"}]}}
    };
  
    var ui5ControlProperties2 = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"title":[{"path":"CategoryName"}],"bindingContextPath":"/ProductCategories*"}},
    };
	
    const nameField = await common.locator.getDisplayedChildElement(ui5ControlProperties, ui5ControlProperties2);
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);
  
  });

  it("step0v1: check name is Accessories - use UI5 Control properties", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "container-cart---app", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    var elem = await common.locator.getDisplayedElement(ui5ControlProperties);
    var attribute = "title";
    var compareValue ="Accessories";
    var val = await ui5ControlConverter.getControlProperty(elem, attribute);
    await expect(val).toBe(compareValue);
  });

  it("step0v1: check name is Accessories - use UI5 Aggregation Control properties", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "container-cart---app", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    var elem = await common.locator.getDisplayedElement(ui5ControlProperties);
    var attribute = "tooltip";
    var compareValue ="Open category Accessories";
    var val = await ui5ControlConverter.getControlAggregationProperty(elem, attribute);
    await expect(val).toBe(compareValue);
  });

  it("step0v1: check name is Accessories - use UI5 Control binding property path", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "container-cart---app", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    var elem = await common.locator.getDisplayedElement(ui5ControlProperties);
    var attribute = "title";
    var aBindings = await ui5ControlConverter.getControlPropertyBinding(elem, attribute);
    await expect(aBindings[0].path).toBe("CategoryName");

  });


  it("step0v1: check name is Accessories - use UI5 Control binding context path", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "container-cart---app", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    var elem = await common.locator.getDisplayedElement(ui5ControlProperties);
    var sContext = await ui5ControlConverter.getControlBindingContextPathProperty(elem);
    await expect(sContext).toBe("/ProductCategories('AC')");

  });

  it("step0v1: check name is Accessories - view Id check", async function () {

    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "container-cart---app", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";
    var compareValue ="Accessories";
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);

  });

  it("step0v1: check name is Accessories - view Id wildcard check", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewId": "cont*cart*", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    await common.locator.getDisplayedElement(ui5ControlProperties);
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);

  });


  it("step0v1: check name is Accessories - view Id for ancestor check", async function () {

    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{ 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      },
      "ancestorProperties": {"metadata":"sap.m.List","mProperties":{
        "items":[{"path":"/ProductCategories"}],
        "viewId": "cont*cart*"
      }}
    };
    await common.locator.getDisplayedElement(ui5ControlProperties);
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);
  });

  it("step0v1: check name is Accessories - view Id for ancestor check wrong", async function () {

    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{ 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      },
      "ancestorProperties": {"metadata":"sap.m.List","mProperties":{
        "items":[{"path":"/ProductCategories"}],
        "viewId": "cont*cartes*"
      }}
    };
    try {
      //var attribute = "title";
      await common.locator.getDisplayedElement(ui5ControlProperties);
			//await element(by.ui5All(ui5ControlProperties)).getAttribute("data-" + attribute);
      await expect(true).toBe(false);
    } catch (error) {
      await expect(true).toBe(true);	
    }
  });	

  it("step0v1: check name is Accessories - view Name check", async function () {

    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewName": "sap.ui.demo.cart.view.App", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    await common.locator.getDisplayedElement(ui5ControlProperties);
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);

  });

  it("step0v1: check name is Accessories - view name wildcard check", async function () {

    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "viewName": "*cart.view*", 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      }
    };
    await common.locator.getDisplayedElement(ui5ControlProperties);
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);

  });


  it("step0v1: check name is Accessories - view name for ancestor check", async function () {

    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{ 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      },
      "ancestorProperties": {"metadata":"sap.m.List","mProperties":{
        "items":[{"path":"/ProductCategories"}],
        "viewName": "*cart.view*"
      }}
    };
    await common.locator.getDisplayedElement(ui5ControlProperties);
    const nameField = element(by.ui5All(ui5ControlProperties, 0));
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);
  });

  it("step0v1: check name is Accessories - view name for ancestor check wrong", async function () {

    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{ 
        "title":[{"path":"CategoryName"}],
        "bindingContextPath":"/ProductCategories*"}
      },
      "ancestorProperties": {"metadata":"sap.m.List","mProperties":{
        "items":[{"path":"/ProductCategories"}],
        "viewName": "*cart.views*asra"
      }}
    };
    try {
      await common.locator.getDisplayedElement(ui5ControlProperties);
      await expect(true).toBe(false);
    } catch (error) {
      await expect(true).toBe(true);	
    }
  });

  it("step0ay:check name is Accessories - chaining assert with no index", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.List","mProperties":{"items":[{"path":"/ProductCategories"}]}},
      "parentProperties":{"metadata":"sap.m.Page","mProperties":{"title":[{"path":"i18n>homeTitle"}]}}
    };
    var list = await common.locator.getDisplayedElement(ui5ControlProperties, 0);

    var ui5ControlProperties2 = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"title":[{"path":"CategoryName"}],"bindingContextPath":"/ProductCategories*"}},
    };

    const nameField = await list.all(by.ui5All(ui5ControlProperties2)).get(0);
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);

  });

  it("step0ay:check name is Accessories - chaining assert with index", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.List","mProperties":{"items":[{"path":"/ProductCategories"}]}},
      "parentProperties":{"metadata":"sap.m.Page","mProperties":{"title":[{"path":"i18n>homeTitle"}]}}
    };
    var list = await common.locator.getDisplayedElement(ui5ControlProperties, 0);

    var ui5ControlProperties2 = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"title":[{"path":"CategoryName"}],"bindingContextPath":"/ProductCategories*"}},
    };

    const nameField = await list.all(by.ui5All(ui5ControlProperties2, 0)).get(0);
    // eslint-disable-next-line no-console
    console.log(await list.all(by.ui5All(ui5ControlProperties2)).count());
    var attribute = "title";
    var compareValue ="Accessories";
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);

  });

  it("check getDisplayedChildElement 1 wrong ", async function(){
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.List","mProperties":{"items":[{"path":"/ProductCategories"}]}},
      "parentProperties":{"metadata":"sap.m.Page","mProperties":{"title":[{"path":"i18n>homeTitle"}]}}
    };
  
    var ui5ControlProperties2 = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"title":[{"path":"CategoryName"}],"bindingContextPath":"/ProductCategories*"}},
    };
	
    const nameField = await common.locator.getDisplayedChildElement(ui5ControlProperties, ui5ControlProperties2);
    var attribute = "title";
    var compareValue ="Computer System Accessories";
    await expect(await nameField.getAttribute("data-" + attribute)).not.toBe(compareValue);
  
  });

  it("step0ay:check name is Accessories - chaining assert with wrong index", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.List","mProperties":{"items":[{"path":"/ProductCategories"}]}},
      "parentProperties":{"metadata":"sap.m.Page","mProperties":{"title":[{"path":"i18n>homeTitle"}]}}
    };
    var list = await common.locator.getDisplayedElement(ui5ControlProperties, 0);

    var ui5ControlProperties2 = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"title":[{"path":"CategoryName"}],"bindingContextPath":"/ProductCategories*"}},
    };
    const nameField = await list.all(by.ui5All(ui5ControlProperties2, 0)).get(0);
    var attribute = "title";
    var compareValue ="Computer System Accessories";
    await expect(await nameField.getAttribute("data-" + attribute)).not.toBe(compareValue);
  });

  it("step0ax:check name is Computer System Accessories - chaining assert", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.List","mProperties":{"items":[{"path":"/ProductCategories"}]}},
      "parentProperties":{"metadata":"sap.m.Page","mProperties":{"title":[{"path":"i18n>homeTitle"}]}}
    };
    var list = await common.locator.getDisplayedElement(ui5ControlProperties, 0);

    var ui5ControlProperties2 = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"title":[{"path":"CategoryName"}]}},
    };

    const nameField = await list.all(by.ui5All(ui5ControlProperties2)).get(1);
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Computer System Accessories";   //expected value
    await expect(await nameField.getAttribute("data-" + attribute)).toBe(compareValue);

  });

  it("step0as:click on the first standard item check id with wildcard", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "id": "*categoryList-0",
        "bindingContextPath" : "/ProductCategories('AC')"
      }}};
    await common.locator.getDisplayedElement(ui5ControlProperties);
    await element(by.ui5All(ui5ControlProperties)).click();
  });

  it("step0ch1:check chaining in a objectlist item", async function () {
	//----------------------- Block for sap.m.ObjectListItem - Get Element Reference
    var objectListProp = {
      "elementProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"title":[{"path":"Name"}],"number":[{"path":"Price"}],"bindingContextPath":"/Products('HT-2001')"}},
    };
    var elem = await common.locator.getDisplayedElement(objectListProp);
    var objectNumber = {
      "elementProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{}},
    };
    var attribute = "number";   //eg: title, text, value etc.
    var compareValue ="449,99";   //expected value
    var expVal = await elem.all(by.ui5All(objectNumber)).getAttribute("data-" + attribute);
    await expect(expVal[0]).toBe(compareValue);
  });

  it("step0ch2:check chaining in a objectlist item with index", async function () {
	//----------------------- Block for sap.m.ObjectListItem - Get Element Reference
    var objectListProp = {
      "elementProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"title":[{"path":"Name"}],"number":[{"path":"Price"}],"bindingContextPath":"/Products('HT-2001')"}},
    };
    var elem = await common.locator.getDisplayedElement(objectListProp);
    var objectNumber = {
      "elementProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{}},
    };
    var attribute = "number";   //eg: title, text, value etc.
    var compareValue ="449,99";   //expected value
    var expVal = await elem.all(by.ui5All(objectNumber, 0)).getAttribute("data-" + attribute);
    await expect(expVal[0]).toBe(compareValue);
  });

  it("step0as:navigate back to main page", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Button","mProperties":{"type":"Back"}},
      "parentProperties":{"metadata":"sap.m.Bar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.Title","mProperties":{}},
      "childProperties":{"metadata":"sap.ui.core.Icon","mProperties":{"src":"sap-icon://nav-back"}}
    };
    await common.userInteraction.click(ui5ControlProperties);
  });

  it("step0an:click on the first standard item check id only with wildcard", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "id": "*categoryList-0"
      }}};
    await common.locator.getDisplayedElement(ui5ControlProperties);
    await element(by.ui5All(ui5ControlProperties)).click();
  });

  it("step0as:navigate back to main page", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Button","mProperties":{"type":"Back"}},
      "parentProperties":{"metadata":"sap.m.Bar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.Title","mProperties":{}},
      "childProperties":{"metadata":"sap.ui.core.Icon","mProperties":{"src":"sap-icon://nav-back"}}
    };
    await common.userInteraction.click(ui5ControlProperties);
  });

  it("step0as:click on the first standard item check id with wildcard", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "id": "*categoryList-1",
        "bindingContextPath" : "/ProductCategories('AC')"
      }}};
    try {
      await common.locator.getDisplayedElement(ui5ControlProperties);
      await element(by.ui5All(ui5ControlProperties)).click();
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step 0i: check first item with aggregation property", async function(){
		//----------------------- Block for sap.m.StandardListItem - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "title":"Accessories", "tooltip": "Open category Accessories"}},
      "parentProperties":{"metadata":"sap.m.List","mProperties":{"headerText":"Categories"}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"type":"Active","title":"Computer System Accessories"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step 0k: check first item with aggregation property wildcard", async function(){
		//----------------------- Block for sap.m.StandardListItem - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "title":"Accessories", "tooltip": "*category Acc*"}},
      "parentProperties":{"metadata":"sap.m.List","mProperties":{"headerText":"Categories"}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"type":"Active","title":"Computer System Accessories"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });
  it("step 0y: check first item with aggregation property wildcard", async function(){
		//----------------------- Block for sap.m.StandardListItem - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "title":"Accessories", "tooltip": "*1category Acc*"}},
      "parentProperties":{"metadata":"sap.m.List","mProperties":{"headerText":"Categories"}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"type":"Active","title":"Computer System Accessories"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step 0v: check first item with association property wrong", async function(){
		//----------------------- Block for sap.m.StandardListItem - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "title":"Accessories", "ariaLabelledBy": "test,test2"}},
      "parentProperties":{"metadata":"sap.m.List","mProperties":{"headerText":"Categories"}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.StandardListItem","mProperties":{"type":"Active","title":"Computer System Accessories"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Accessories";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step0:check if product list aggregation bindingpath is correct", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.List","mProperties":{
        "headerText":{"path": "homeCategoryListHeader"},
        "items": {"path": "/ProductCategories"}
      }},
      "parentProperties":{"metadata":"sap.m.Page","mProperties":{
        "title":{"path": "homeTitle"}
      }},
      "childProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "bindingContextPath" : "/ProductCategories('AC')",
        "counter":{"path": "NumberOfProducts"},
        "title":{"path": "CategoryName"},
        "tooltip":[{"path": "i18n>openCategoryProducts"},{"path": "CategoryName"}]
      }}
    };
    var Index = 0;
    var attribute1 = "items";   //eg: title, text, value etc.
    var comparePath1 ="/ProductCategories";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index, 100, 30000);
  });

  it("step0a:click on the first standard item", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
        "bindingContextPath" : "/ProductCategories('AC')"
      }}};
    await common.locator.getDisplayedElement(ui5ControlProperties);
    await element(by.ui5All(ui5ControlProperties)).click();
  });

  it("step1t:check text for specific list item ancestor with * wildcard", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video Cable Kit - 4m"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "*",
        "items": {"path": "Products"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29*","unit":"EUR","state":"None"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "text";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step1e:check text for specific list item ancestor", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video*"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"bindingContextPath":"/Products('HT-2026')"}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "/ProductCategories('AC')",
        "items": {"path": "Products"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29,99","unit":"EUR","state":"None","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "text";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step1v:check text for specific list item ancestor with wild card", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video Cable Kit - 4m"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"bindingContextPath":"/Products('HT-2026')"}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "*ProductCategories*('AC')",
        "items": {"path": "Products"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29,99","unit":"EUR","state":"None","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "text";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step1x:check text for specific list item ancestor with wild card 2", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video Cable Kit - 4m"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"bindingContextPath":"/Products('HT-2026')"}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "ProductCategories('AC')*",
        "items": {"path": "Products"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29,99","unit":"EUR","state":"None","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "text";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step1y:check text for specific list item ancestor with wild card 2", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video Cable Kit - 4m"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"bindingContextPath":"/Products('HT-2026')"}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "*('AC')**",
        "items": {"path": "Products"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29,99","unit":"EUR","state":"None","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "text";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step1f:check text for specific list item ancestor", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video Cable Kit - 4m"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "/ProductCategories('AC')",
        "items": {"path": "Products"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29,99","unit":"EUR","state":"None"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "text";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step1s:check text for specific list item ancestor with wrong wildcard", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video Cable Kit - 4m"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "*ProductCategories1*('AC')*",
        "items": {"path": "Products"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29,99","unit":"EUR","state":"None"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step1k:check text for specific list item sibling", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{
        "title":"Audio/Video Cable Kit - 4m","number":"29,99","numberUnit":"EUR"
      }},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "/ProductCategories('AC')",
        "items": {"path": "Products"}
      }},
      "siblingProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{
        "title":"Beam Breaker B-1","number":"469,00","numberUnit":"EUR"}}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step1i:check text for specific list item sibling wrong property", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{
        "title":"Audio/Video Cable Kit - 4m","number":"29,99","numberUnit":"EUR"
      }},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "/ProductCategories('AC')",
        "items": {"path": "Products"}
      }},
      "siblingProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{
        "title":"Beam Breaker B-2","number":"469,00","numberUnit":"EUR"}}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step1h:check text for specific list item ancestor wrong path", async function () {
			//----------------------- Block for sap.m.Text - Perform Assert -----------------------
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Text","mProperties":{"text":"Audio/Video Cable Kit - 4m"}},
      "parentProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"bindingContextPath":"/Products('HT-2026')"}},
      "ancestorProperties":{"metadata":"sap.m.List","mProperties":{
        "bindingContextPath" : "/ProductCategories('AC')",
        "items": {"path": "Products1"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"number":"29,99","unit":"EUR","state":"None","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"text":"Titanium"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "text";   //eg: title, text, value etc.
    var compareValue ="Audio/Video Cable Kit - 4m";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step0b:navigate back to main page", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Button","mProperties":{"type":"Back"}},
      "parentProperties":{"metadata":"sap.m.Bar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.Title","mProperties":{}},
      "childProperties":{"metadata":"sap.ui.core.Icon","mProperties":{"src":"sap-icon://nav-back"}}
    };
    await common.userInteraction.click(ui5ControlProperties);
  });

  it("step0c:click on the second standard item", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.StandardListItem","mProperties":{
      }}};
    await common.locator.getDisplayedElement(ui5ControlProperties);
    await element(by.ui5All(ui5ControlProperties, 1)).click();
  });

  it("step0d:navigate back to main page", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.Button","mProperties":{"type":"Back"}},
      "parentProperties":{"metadata":"sap.m.Bar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{"metadata":"sap.m.Title","mProperties":{}},
      "childProperties":{"metadata":"sap.ui.core.Icon","mProperties":{"src":"sap-icon://nav-back"}}
    };
    await common.userInteraction.click(ui5ControlProperties);
  });

  it("step0c:expect main page visible", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.SearchField","mProperties":{"placeholder":"Search"}},
      "parentProperties":{"metadata":"sap.m.Toolbar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{}
    };
    await ui5.common.assertion.expectToBeVisible(ui5ControlProperties, 0, 10, 30000);
  });

  it("step1:enter on Accessories and search", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.SearchField","mProperties":{"placeholder":"Search"}},
      "parentProperties":{"metadata":"sap.m.Toolbar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{}
    };
    var value = "Flat Basic";   //value to be entered by user
    await common.userInteraction.searchFor(ui5ControlProperties, value, 0, 30000, false);
  });

  it("step1a:enter on Accessories and search wrong element value", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.SearchField","mProperties":{"placeholders":"Search1"}},
      "parentProperties":{"metadata":"sap.m.Toolbar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{}
    };
    var value = "Flat Basic";   //value to be entered by user
    try {
      await common.userInteraction.searchFor(ui5ControlProperties, value, 0, 30000, false);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step1b:enter on Accessories and search with additional property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.SearchField","mProperties":{"placeholder":"Search", "enableSuggestions": "false", "maxLength": "0"}},
      "parentProperties":{"metadata":"sap.m.Toolbar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{}
    };
    var value = "Flat Basic";   //value to be entered by user
    await common.userInteraction.searchFor(ui5ControlProperties, value, 0, 30000, false);
  });

  it("step1c:enter on Accessories and search with wrong boolean additional property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.SearchField","mProperties":{"placeholder":"Search", "enableSuggestions": "true", "maxLength": "0"}},
      "parentProperties":{"metadata":"sap.m.Toolbar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{}
    };
    try {
      await common.userInteraction.searchFor(ui5ControlProperties, value, 0, 30000, false);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step1c:enter on Accessories and search with wrong number additional property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.SearchField","mProperties":{"placeholder":"Search", "enableSuggestions": "false", "maxLength": "1"}},
      "parentProperties":{"metadata":"sap.m.Toolbar","mProperties":{}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{}
    };
    try {
      await common.userInteraction.searchFor(ui5ControlProperties, value, 0, 30000, false);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step2:click  on Object item", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"numberUnit":"EUR","type":"Inactive","icon":"./../../../../../../test-resources/sap/ui/documentation/sdk/images/HT-1035.jpg","title":"Flat Basic","number":"399,00"}},
      "parentProperties":{"metadata":"sap.m.List","mProperties":{"mode":"SingleSelectMaster","noDataText":"No products found"}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{"metadata":"sap.m.Image","mProperties":{"src":"./../../../../../../test-resources/sap/ui/documentation/sdk/images/HT-1035.jpg"}}
    };
    await common.userInteraction.click(ui5ControlProperties);
  });

  it("step2b:click  on Object item wrong child property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"numberUnit":"EUR","type":"Inactive","icon":"./../../../../../../test-resources/sap/ui/documentation/sdk/images/HT-1035.jpg","title":"Flat Basic","number":"399,00"}},
      "parentProperties":{"metadata":"sap.m.List","mProperties":{"mode":"SingleSelectMaster","noDataText":"No products found"}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{"metadata":"sap.m.Image","mProperties":{"src":"./../../../../../../test-resources/sap/ui/documentation/sdk/images/HT-1036.jpg"}}
    };
    try {
      await common.userInteraction.click(ui5ControlProperties);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step2c:click  on Object item wrong element property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectListItem","mProperties":{"numberUnit":"EUV","type":"Inactive","icon":"./../../../../../../test-resources/sap/ui/documentation/sdk/images/HT-1035.jpg","title":"Flat Basic","number":"399,00"}},
      "parentProperties":{"metadata":"sap.m.List","mProperties":{"mode":"SingleSelectMaster","noDataText":"No products found"}},
      "prevSiblingProperties":{},
      "nextSiblingProperties":{},
      "childProperties":{"metadata":"sap.m.Image","mProperties":{"src":"./../../../../../../test-resources/sap/ui/documentation/sdk/images/HT-1036.jpg"}}
    };
    try {
      await common.userInteraction.click(ui5ControlProperties);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step3:check if Supplier text exists", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"title":"Supplier","text":"Very Best Screens"}},
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Supplier";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);

  });

  it("step3a:check if Supplier text exists wrong parent property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"title":"Supplier","text":"Very Best Screens"}},
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basics","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Supplier";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step3b:check if Supplier text exists wrong prevSibiling property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"title":"Supplier","text":"Very Best Screens"}},
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Supplier";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step3c:check if Supplier text exists wrong nextSibiling property", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"title":"Supplier","text":"Very Best Screens"}},
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Suckscess"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Supplier";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step3d:check if Supplier text exists remove childproperties", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{"title":"Supplier","text":"Very Best Screens"}},
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}}
    };
    var Index = 0;
    var attribute = "title";   //eg: title, text, value etc.
    var compareValue ="Supplier";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);

  });

  it("step4:check if Supplier i18n path is correct", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n>productSupplierAttributeText"}],
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 ="i18n>productSupplierAttributeText";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    var attribute2 = "text";   //eg: title, text, value etc.
    var comparePath2 ="SupplierName";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute2, comparePath2, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step4:check if Supplier context path is correct", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n>productSupplierAttributeText"}],
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index, 0, 30000);
  });

  it("step4a:check if Supplier i18n path is correct remove model name", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n>productSupplierAttributeText"}],
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 ="productSupplierAttributeText";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    var attribute2 = "text";   //eg: title, text, value etc.
    var comparePath2 ="SupplierName";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute2, comparePath2, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step4b:check if Supplier i18n path is correct wrong binding context", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1025')",
        "title":[{"path": "i18n>productSupplierAttributeText"}],
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    try {
      await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true, "Correct!");
    }
  });

  it("step4c:check if Supplier i18n path is correct wrong binding path name", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n>productSupplierAttributeText"}],
        "text":[{"path": "SupplierNames"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    try {
      var attribute2 = "text";   //eg: title, text, value etc.
      var comparePath2 ="SupplierName";   //expected value
      await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute2, comparePath2, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step4d:check if Supplier i18n path is correct no model defined", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n"}],
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    try {
      var attribute1 = "title";   //eg: title, text, value etc.
      var comparePath1 ="productSupplierAttributeText";   //expected value
      await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step4e:check if Supplier i18n path is correct not array", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":{"path": "i18n>productSupplierAttributeText"},
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 ="i18n>productSupplierAttributeText";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    var attribute2 = "text";   //eg: title, text, value etc.
    var comparePath2 ="SupplierName";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute2, comparePath2, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step4f:check if Supplier i18n path is correct only binding path", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "text":[{"path": "SupplierName"}]}
      }};
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 ="i18n>productSupplierAttributeText";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    var attribute2 = "text";   //eg: title, text, value etc.
    var comparePath2 ="SupplierName";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute2, comparePath2, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step4h:check if Supplier i18n path is correct only i18n text key", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "title":{"path": "i18n>productSupplierAttributeText"}
      }}};
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 ="i18n>productSupplierAttributeText";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    var attribute2 = "text";   //eg: title, text, value etc.
    var comparePath2 ="SupplierName";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute2, comparePath2, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step4k:check if Supplier i18n path is correct bindings as array", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n>productSupplierAttributeText"}],
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 = ["i18n>productSupplierAttributeText"];   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    var attribute2 = "text";   //eg: title, text, value etc.
    var comparePath2 =["SupplierName"];   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute2, comparePath2, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step4l:check if Supplier i18n path is wrong bindings as array", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n>productSupplierAttributeText"}],
        "text":[{"path": "SupplierName"}]}
      },
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{"titleLevel":"H3","numberUnit":"EUR","title":"Flat Basic","number":"399,00"}},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectNumber","mProperties":{"unit":"EUR","number":"399,00","textDirection":"Inherit","textAlign":"Right"}},
      "nextSiblingProperties":{"metadata":"sap.m.ObjectStatus","mProperties":{"text":"Available","state":"Success"}},
      "childProperties":{}
    };
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 = ["i18n>productSupplierAttributeText"];   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    var attribute2 = "text";   //eg: title, text, value etc.
    //var comparePath2 = ["SupplierName", "SupplierNames"];
		//
    var elem = await common.locator.getDisplayedElement(ui5ControlProperties);
    var value = await elem.getAttribute("data-" + attribute2 + "-path");
    await expect(value).not.toContain("SupplierNames");
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step5:check if Weight i18n path is correct and previous or next is correct", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":[{"path": "i18n>productWeightAttributeText"}],
        "text":[
          {"path": "Weight"},
          {"path": "WeightUnit"},
        ]
      }},
      "parentProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{
        "title":{"path": "Name"},
        "number":{"path": "Price"}
      }},
      "prevSiblingProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "title":{"path": "productDescriptionAttributeText"},
        "text":{"path": "ShortDescription"}
      }},
      "nextSiblingProperties":{
        "metadata":"sap.m.ObjectAttribute","mProperties":{
          "bindingContextPath" : "/Products('HT-1035')",
          "title":{"path": "productMeasuresAttributeText"},
          "text":[
            {"path": "DimensionWidth"},
            {"path": "Unit"},
            {"path": "DimensionDepth"},
            {"path": "DimensionHeight"}
          ]
        }}
    };
    var Index = 0;
    var attribute1 = "title";   //eg: title, text, value etc.
    var comparePath1 ="productWeightAttributeText";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step6:check if product measure is correct", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":{"path": "productMeasuresAttributeText"},
        "text":[
          {"path": "DimensionWidth"},
          {"path": "Unit"},
          {"path": "DimensionDepth"},
          {"path": "DimensionHeight"}
        ]
      }}
    };
    var Index = 0;
    var attribute1 = "text";   //eg: title, text, value etc.
    var comparePath1 =["DimensionHeight", "Unit"];   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });

  it("step6a:check if product measure is correct with bindingpath on children element", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{
        "numberUnit":"EUR","title":"Flat Basic","number":"399,00"
      }},
      "childProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":{"path": "productMeasuresAttributeText"},
        "text":[
          {"path": "DimensionWidth"},
          {"path": "Unit"},
          {"path": "DimensionDepth"},
          {"path": "DimensionHeight"}
        ]
      }}
    };
    var Index = 0;
    var attribute = "number";   //eg: title, text, value etc.
    var compareValue ="399,00";   //expected value
    await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
  });

  it("step6b:check if product measure is correct with wrong bindingpath on children element", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{
        "numberUnit":"EUR","title":"Flat Basic","number":"399,00"
      }},
      "childProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":{"path": "productMeasuresAttributeText"},
        "text":[
          {"path": "DimensionWidths"},
          {"path": "Unit"},
          {"path": "DimensionDepth"},
          {"path": "DimensionHeight"}
        ]
      }}
    };
    var Index = 0;
    var attribute = "number";   //eg: title, text, value etc.
    var compareValue ="399,00";   //expected value
    try {
      await common.assertion.expectAttributeToBe(ui5ControlProperties, attribute, compareValue, Index);
      await expect(true).toBe(false);
    } catch (e) {
      await expect(true).toBe(true);
    }
  });

  it("step6c:check if product measure is correct with number bindingpath", async function () {
    var ui5ControlProperties = {
      "elementProperties":{"metadata":"sap.m.ObjectHeader","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":{"path": "Name"},
        "number":{"path": "Price"},
      }},
      "childProperties":{"metadata":"sap.m.ObjectAttribute","mProperties":{
        "bindingContextPath" : "/Products('HT-1035')",
        "title":{"path": "productMeasuresAttributeText"},
        "text":[
          {"path": "DimensionWidth"},
          {"path": "Unit"},
          {"path": "DimensionDepth"},
          {"path": "DimensionHeight"}
        ]
      }}};
    var Index = 0;
    var attribute1 = "number";   //eg: title, text, value etc.
    var comparePath1 ="Price";   //expected value
    await common.assertion.expectBindingPathToBe(ui5ControlProperties, attribute1, comparePath1, Index);
    await common.assertion.expectBindingContextPathToBe(ui5ControlProperties, "/Products('HT-1035')", Index);
  });
});
