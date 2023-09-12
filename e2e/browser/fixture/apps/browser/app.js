  "use strict";
  module.exports = {
    create: function () {
      sap.ui.require([
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Core",
        "sap/m/Input",
        "sap/m/App",
        "sap/m/SearchField",
        "sap/m/Text",
        "sap/m/Page",
        "sap/m/List",
        "sap/m/StandardListItem",
        "sap/m/Button",
        "sap/m/Bar",
        "sap/ui/core/HTML"
      ], function(JSONModel, Core, Input, App, SearchField, MText, Page, List, StandardListItem, Button, Bar, HTML) {
        var oModel = new JSONModel({
          propertyText: "myProperty",
            compositeProperty: {
              partOne: "some",
              partTwo: "name"
            }
        });
        sap.ui.getCore().setModel(oModel);

        var input = new Input();
        input.bindObject({path: "/compositeProperty"});
        input.bindProperty("value", {path: "partOne"});
        input.bindProperty("description", {path: "partTwo"});

        var app = new App("myApp", {initialPage:"page1"});
        var search = new SearchField("SFB1", {placeholder: "search for...", width: "100%"});
        var searchQuery = new MText("search-query");

        search.attachSearch(function (oEvent) {
          searchQuery.setText(oEvent.getSource().getValue());
        });

        var page1 = new Page("page1", {
          title: "Page 1",
          content : [
            new List({
              id: "ListPage1",
              items: [
                new StandardListItem({title:"1"}),
                new StandardListItem({title:"2"}),
                new StandardListItem({title:"3"})
              ]
            }),
            new Button({
              id : "show-footer-btn",
              text : "Show footer",
              press : function() {
                page1.setShowFooter(true);
              }
            }),
            new Button({
              id : "hide-footer-btn",
              text : "Hide footer",
              press : function() {
                page1.setShowFooter(false);
              }
            }),
            new Button({
              id : "go-to-page-2-btn",
              text : "To Page 2",
              press : function() {
                app.to("page2");
              }
            }),
            new Button({
              id : "show-nav-btn",
              text : "show Nav Button",
              press : function() {
                page1.setShowNavButton(true);
              }
            }),
            new Button({
              id : "hide-nav-btn",
              text : "hide Nav Button",
                press : function() {
                  page1.setShowNavButton(false);
                }
              }),
              input,
              searchQuery
          ],
          subHeader: new Bar({
            contentMiddle: [search]
          }),
          footer: new Bar({
            id: 'page1-footer',
            contentMiddle: [
              new Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"}),
              new Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"}),
              new Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"}),
              new Button({icon:"images/iconCompetitors.png", tooltip: "Trophy"})
            ]
          })
        });

        var page2 = new Page("page2", {
          title:"Page 2",
          backgroundDesign:"Standard",
          showNavButton: true,
          navButtonText: "Page 1",
          navButtonPress: function(){ app.back(); },
          icon: "sap-icon://favorite",
          enableScrolling: false,
          headerContent: new Button({
            text : "Options",
            press : function() {
              alert("Options would open now.");
            }
          }),
          content : [
            new Button({
              text : "Back to Page 1",
              press : function() {
                app.back();
              }
            }),
            new HTML({content:"<div>This page does not scroll.</div>"})
          ]
        });

        page2.setBackgroundDesign("List");
        app.addPage(page1).addPage(page2);

        app.placeAt("body");
        sap.ui.getCore().applyChanges();
      });
    }
  };
