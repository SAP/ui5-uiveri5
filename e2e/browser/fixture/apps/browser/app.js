module.exports = {
  create: function () {
    var oModel = new sap.ui.model.json.JSONModel({
      propertyText: "myProperty",
        compositeProperty: {
          partOne: "some",
          partTwo: "name"
        }
    });
    sap.ui.getCore().setModel(oModel);

    var input = new sap.m.Input();
    input.bindObject({path: "/compositeProperty"});
    input.bindProperty("value", {path: "partOne"});
    input.bindProperty("description", {path: "partTwo"});

    var app = new sap.m.App("myApp", {initialPage:"page1"});
    var search = new sap.m.SearchField("SFB1", {placeholder: "search for...", width: "100%"});
    var searchQuery = new sap.m.Text("search-query");

    search.attachSearch(function (oEvent) {
      searchQuery.setText(oEvent.getSource().getValue());
    });

    var page1 = new sap.m.Page("page1", {
      title: "Page 1",
      content : [
        new sap.m.List({
          id: "ListPage1",
          items: [
            new sap.m.StandardListItem({title:"1"}),
            new sap.m.StandardListItem({title:"2"}),
            new sap.m.StandardListItem({title:"3"})
          ]
        }),
        new sap.m.Button({
          id : "show-footer-btn",
          text : "Show footer",
          press : function() {
            page1.setShowFooter(true);
          }
        }),
        new sap.m.Button({
          id : "hide-footer-btn",
          text : "Hide footer",
          press : function() {
            page1.setShowFooter(false);
          }
        }),
        new sap.m.Button({
          id : "go-to-page-2-btn",
          text : "To Page 2",
          press : function() {
            app.to("page2");
          }
        }),
        new sap.m.Button({
          id : "show-nav-btn",
          text : "show Nav Button",
          press : function() {
            page1.setShowNavButton(true);
          }
        }),
        new sap.m.Button({
          id : "hide-nav-btn",
          text : "hide Nav Button",
            press : function() {
              page1.setShowNavButton(false);
            }
          }),
          input,
          searchQuery
      ],
      subHeader: new sap.m.Bar({
        contentMiddle: [search]
      }),
      footer: new sap.m.Bar({
        id: 'page1-footer',
        contentMiddle: [
          new sap.m.Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"}),
          new sap.m.Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"}),
          new sap.m.Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"}),
          new sap.m.Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"})
        ]
      })
    });

    var page2 = new sap.m.Page("page2", {
      title:"Page 2",
      backgroundDesign:"Standard",
      showNavButton: true,
      navButtonText: "Page 1",
      navButtonPress: function(){ app.back(); },
      icon: "sap-icon://favorite",
      enableScrolling: false,
      headerContent: new sap.m.Button({
        text : "Options",
        press : function() {
          alert("Options would open now.");
        }
      }),
      content : [
        new sap.m.Button({
          text : "Back to Page 1",
          press : function() {
            app.back();
          }
        }),
        new sap.ui.core.HTML({content:"<div>This page does not scroll.</div>"})
      ]
    });

    page2.setBackgroundDesign("List");
    app.addPage(page1).addPage(page2);

    app.placeAt("body");
    sap.ui.getCore().applyChanges();
  }
};
