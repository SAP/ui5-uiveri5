module.exports = createPageObjects({
  Product: {
    actions: {
            
    },
    assertions: {
      theProductTitleIsShown: function () {
        var header = element(by.control({
          controlType: "sap.m.ObjectHeader",
          viewName: "sap.ui.demo.cart.view.Product",
          bindingPath: {
            path: "/Products('HT-6130')",
            propertyPath: "Name"
          }
        }));
        
        expect(header.asControl().getProperty("title")).toBe("Flat Watch HD32");
      },
      theProductCouldBeOrdered: function () {
        var button = element(by.control({
          controlType: "sap.m.Button",
          viewName: "sap.ui.demo.cart.view.Product",
          i18NText: {
              propertyName: "text",
              key: "addToCartShort"
          },
          interaction: {
              idSuffix: "BDI-content"
          }
        }));

        expect(button.isDisplayed()).toBeTruthy()
    }
    }
  }
});