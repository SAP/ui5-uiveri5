var ClassicalWaitForUI5 = require('../src/scripts/classicalWaitForUI5');
var sinon = require('sinon');

describe('waitForUI5: ClassicalWaitForUI5', function() {
  var requests = [];
  var iWaitForUI5Timeout = 500;
  var oCore = {
    getUIDirty: function () {
      return false;
    }
  };

  beforeEach(function() {
    jasmine.clock().install();
    window = global;
    window.location = {
      search: 'sap-ui-classical-waitforui5-debug=true'
    };
    window.console.debug = window.console.log;

    requests = [];
    window.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
    XMLHttpRequest.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });

  afterEach(function() {
    XMLHttpRequest.restore();
    jasmine.clock().uninstall();
  });

  describe('handling window timeouts', function() {
    it('timeout delay threshold', function() {
      var oClassicalWaitForUI5 = new ClassicalWaitForUI5(iWaitForUI5Timeout, oCore);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);

      //should wait for timeout till 5s
      setTimeout(function() {}, 5000);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(1);
      jasmine.clock().tick(5001);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);

      //should not wait for timeout bigger than 5s
      setTimeout(function() {}, 6000);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);
    });

    it('timeout call count threshold', function() {
      var oClassicalWaitForUI5 = new ClassicalWaitForUI5(iWaitForUI5Timeout, oCore);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);

      //should wait for timeout with call count till 5 times
      for (var i = 0; i < 5; i++) {
        setTimeout(function() {}, 0);
      }
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(5);
      jasmine.clock().tick(1);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);

      //should not wait for timeout with call count bigger than 5 times
      for (var j = 0; j < 6; j++) {
        setTimeout(function() {}, 0);
      }
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(5);
      jasmine.clock().tick(1);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);
    });

    it('cleared timeout', function() {
      var oClassicalWaitForUI5 = new ClassicalWaitForUI5(iWaitForUI5Timeout, oCore);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);

      //should not wait for canceled timeout
      var timeout = setTimeout(function() {}, 1000);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(1);
      clearTimeout(timeout);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);
    });

    it('chained timeouts', function() {
      var oClassicalWaitForUI5 = new ClassicalWaitForUI5(iWaitForUI5Timeout, oCore);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);

      var delay = 1000;
      //should wait for chained timeouts
      setTimeout(function() {
        expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(1);
        setTimeout(function() {
          expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(1);
        }, delay);
      }, delay);

      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(1); //the first timeout
      jasmine.clock().tick(1001);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(1); //the second timeout
      jasmine.clock().tick(1001);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);
    });

    it('polling', function() {
      var oClassicalWaitForUI5 = new ClassicalWaitForUI5(iWaitForUI5Timeout, oCore);
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);

      var firstFunction = function() {
        setTimeout(function() {
          secondFunction();
        }, 350);
      };

      var secondFunction = function() {
        setTimeout(function() {
          firstFunction();
        }, 300);
      };

      firstFunction();
      secondFunction();
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(2);

      jasmine.clock().tick(350); //the timeouts from the originally called functions will be finished
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(2); //the timeouts called by inside functions will be pending

      //after 5 times of unique timeout it wouldn't be tracked any more
      jasmine.clock().tick(1750); //firstFunction() called from secondFunction() 5*350=1750
      expect(oClassicalWaitForUI5.aPendingTimeouts.length).toEqual(0);
    });
  });

  describe('handling XHR requests', function() {
    it('wait for XHR requests', function () {
      var oClassicalWaitForUI5 = new ClassicalWaitForUI5(iWaitForUI5Timeout, oCore);

      expect(oClassicalWaitForUI5.aPendingXhrs.length).toEqual(0);

      var xhrResponse = [ 200, {}, '[]' ];
      var xhr = new XMLHttpRequest();

      xhr.open('', '');
      xhr.send();
      expect(oClassicalWaitForUI5.aPendingXhrs.length).toEqual(1);
      requests[0].respond(xhrResponse);
      expect(oClassicalWaitForUI5.aPendingXhrs.length).toEqual(0);

      var xhr2 = new XMLHttpRequest();
      xhr2.open('', '');
      xhr2.send();
      expect(oClassicalWaitForUI5.aPendingXhrs.length).toEqual(1);

      var xhr3 = new XMLHttpRequest();
      xhr3.open('', '');
      xhr3.send();
      expect(oClassicalWaitForUI5.aPendingXhrs.length).toEqual(2);

      requests[2].respond(xhrResponse);
      expect(oClassicalWaitForUI5.aPendingXhrs.length).toEqual(1);

      requests[1].respond(xhrResponse);
      expect(oClassicalWaitForUI5.aPendingXhrs.length).toEqual(0);
    });
  });

});