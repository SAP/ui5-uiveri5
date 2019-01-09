module.exports = {
  create: function () {
    var oTimeout;
    var btn = new sap.m.Button({
      id: 'button',
      text: 'Click me',
      press: function(oEvent) {
        if(oTimeout) {
          window.clearTimeout(oTimeout);
        }
        oTimeout = window.setTimeout(function() {
          console.log('+++++++ CLICKED!');
          window.setTimeout(function() {
            new sap.m.MessageToast.show("Pressed");
          }, 990);
        }, 980);
      }
    });

    btn.placeAt('body');
    sap.ui.getCore().applyChanges();
  }
};
