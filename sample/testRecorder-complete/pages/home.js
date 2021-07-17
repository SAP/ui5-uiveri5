module.exports = createPageObjects({
  Home: {
    actions: {
      iSearchForProduct: function () {
        element(by.control({
          id: "container-cart---homeView--searchField",
          interaction: {
            idSuffix: "I"
          }
        })).sendKeys("Watch");
      },
      iSelectTheFirstProduct: function () {
        element(by.control({
            controlType: "sap.m.Text",
            viewName: "sap.ui.demo.cart.view.Home",
            properties: {
                text: "Flat Watch HD32"
            },
            interaction: {
                idSuffix: "inner"
            }
        })).click();
    }
    },
    assertions: {
      iShouldSeeAllCategories: function () {
        var list = element.all(by.control({
          controlType: "sap.m.StandardListItem",
          viewName: "sap.ui.demo.cart.view.Home"
        }));
        expect(list.count()).toBe(16);
      },
      theProductListShouldBeFiltered: function () {
        var list = element.all(by.control({
          controlType: "sap.m.ObjectListItem",
          viewName: "sap.ui.demo.cart.view.Home"
        }));

        var firstItem = list.get(0);
        expect(firstItem.asControl().getProperty("title")).toBe("Flat Watch HD32");
      }
    }
  }
});