  "use strict";
  module.exports = {
    create: function () {
      sap.ui.require(["sap/m/Button", "sap/m/MessageToast", "sap/ui/core/Core"], function(Button, MessageToast, Core) {
        var oTimeout;
        var btn = new Button({
          id: 'button',
          text: 'Click me',
          press: function(oEvent) {
            if(oTimeout) {
              window.clearTimeout(oTimeout);
            }
            oTimeout = window.setTimeout(function() {
              console.log('+++++++ CLICKED!');
              window.setTimeout(function() {
                new MessageToast.show("Pressed");
              }, 990);
            }, 980);
          }
        });

        btn.placeAt('body');
        sap.ui.getCore().applyChanges();
      });
    }
  };
