describe("cliParser", function() {

  var argvStub = {
    _: []
  };
  cliParser = new require('../src/cliParser')();

  describe("Should parse browsers from command-line", function() {
    it('Should parse single browser name', function () {
      argvStub.browsers = 'ie';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'ie'}]);
    });

    it('Should parse multiple browser names', function () {
      argvStub.browsers = 'firefox,ie';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'firefox'},{browserName:'ie'}]);
    });

    it('Should parse JSON-formatted arguments in browsers key', function () {
      argvStub.browsers = '{"browserName": "chrome","browserVersion": "45"}';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'chrome',browserVersion:'45'}]);
    });

    it('Should parse :-separated arguments in browsers key', function () {
      argvStub.browsers = 'chrome:45';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'chrome',browserVersion:'45'}]);
    });

    it('Should parse mixed formatted arguments in browsers key', function () {
      argvStub.browsers = 'firefox,ie:9,{"browserName": "chrome","browserVersion": "45"}';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([
        {browserName:'firefox'},{browserName:'ie',browserVersion:'9'},{browserName:'chrome',browserVersion:'45'}]);
    });
  });
});
