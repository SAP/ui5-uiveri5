
describe("cliParser", function() {

  var ArgvStub = function(){
    this._ = [];
  };
  cliParser = new require('../src/cliParser')();

  describe("Should parse browsers from command-line", function() {
    it('Should parse single browser name', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'ie';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'ie'}]);
    });

    it('Should parse multiple browser names', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'firefox,ie';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'firefox'},{browserName:'ie'}]);
    });

    it('Should parse :-separated arguments in browsers key', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'chrome:45';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'chrome',browserVersion:'45'}]);
    });
  });

  describe("Should parse generic configs from command-line", function() {

    it('Should parse JSON-formatted objects in config key', function () {
      var argvStub = new ArgvStub();
      argvStub.config = '{"browsers": [{"browserName": "chrome","browserVersion": "45"}]}';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName:'chrome',browserVersion:'45'}]);
    });

    it('Should merge JSON-formatted objects in config key', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'firefox,ie';
      argvStub.config = '{"browsers": [{"browserName": "chrome","browserVersion": "45"}]}';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual(
        [{browserName:'firefox'},{browserName:'ie'},{browserName:'chrome',browserVersion:'45'}]);
    });

    it('Should parse single value JSON-formatted objects in config key', function () {
      var argvStub = new ArgvStub();
      argvStub.config = {key1:{key2:'value'}};
      var config = cliParser.parse(argvStub);

      expect(config).toEqual({key1:{key2:'value'},conf: undefined});
    });
  });
});
