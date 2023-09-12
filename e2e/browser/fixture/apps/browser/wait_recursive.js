  "use strict";
  module.exports = {
    create: function () {
      sap.ui.require(["sap/m/Button", "sap/ui/core/Core"], function(Button, Core) {
        var btn = new Button({
          id: 'button',
          text: 'Click me',
          press: function(oEvent) {
            functionParent();
            functionParent2();
          }
        });
        
        var functionParent = function () {
          console.log('+++++++ PARENT!');
          this.delayedCall(350, functionParent);
        };
        
        var functionParent2 = function () {
          console.log('+++++++ PARENT 2!');
          this.delayedCall(300, functionParent2);
        };
        
        var delayedCall = function (delay, callbackFunc) {
          console.log('+++++++ delayedCall !');
          window.setTimeout(function() {
            callbackFunc();
          }, delay);
        };
        
        btn.placeAt('body');
        sap.ui.getCore().applyChanges();
      });
    }
  };
