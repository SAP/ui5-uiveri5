
describe("cliParser", function() {

  var ArgvStub = function () {
    this._ = [];
  };
  cliParser = new require('../src/cliParser')();

  describe("Should parse browsers from command-line", function () {
    it('Should parse single browser name as string', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'ie';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName: 'ie'}]);
    });

    it('Should parse multiple browser names as string', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'firefox,ie';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName: 'firefox'}, {browserName: 'ie'}]);
    });

    it('Should parse browser name as array of strings', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = ['firefox', 'ie'];
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName: 'firefox'}, {browserName: 'ie'}]);
    });

    it('Should parse :-separated arguments in browsers key', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'chrome:45';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName: 'chrome', browserVersion: '45'}]);
    });

    it('Should parse all :-separated arguments with spaces in browsers key', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'safari:*:ios:9.1:*:bluecrystal:ltr:cozy';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{
        browserName: 'safari',
        browserVersion: '*',
        platformName: 'ios',
        platformVersion: '9.1',
        platformResolution: '*',
        ui5: {theme: 'bluecrystal', direction: 'ltr', mode: 'cozy'}
      }]);
    });

    it('Should parse JSON-formatted arguments in browsers key', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = '{"browserName":"ie"}';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName: 'ie'}]);
    });

    it('Should parse mixed formatted arguments in browsers key', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = '{"browserName":"ie","ui5":{"theme":"bluecrystal"}},chrome,firefox:*:windows:*:*:bluecrystal:ltr:cozy';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName: 'ie', ui5: {theme: 'bluecrystal'}}, {browserName: 'chrome'}, {
        browserName: 'firefox',
        browserVersion: '*',
        platformName: 'windows',
        platformVersion: '*',
        platformResolution: '*',
        ui5: {theme: 'bluecrystal', direction: 'ltr', mode: 'cozy'}
      }]);
    });
  });

  describe("Should parse configs from command-line", function () {

    it('Should parse JSON-formatted objects in config key', function () {
      var argvStub = new ArgvStub();
      argvStub.config = '{"browsers": [{"browserName": "chrome","browserVersion": "45"}]}';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual([{browserName: 'chrome', browserVersion: '45'}]);
    });

    it('Should merge JSON-formatted objects in config key', function () {
      var argvStub = new ArgvStub();
      argvStub.browsers = 'firefox,ie';
      argvStub.config = '{"browsers": [{"browserName": "chrome","browserVersion": "45"}]}';
      var config = cliParser.parse(argvStub);

      expect(config.browsers).toEqual(
        [{browserName: 'firefox'}, {browserName: 'ie'}, {browserName: 'chrome', browserVersion: '45'}]);
    });

    it('Should parse single value JSON-formatted objects in config key', function () {
      var argvStub = new ArgvStub();
      argvStub.config = {key1: {key2: 'value'}};
      var config = cliParser.parse(argvStub);

      expect(config).toEqual({key1: {key2: 'value'}, conf: undefined});
    });

    it('Should parse multiple value JSON-formatted objects in config key', function () {
      var argvStub = new ArgvStub();
      // add several config entries so to simulate different types of cli config passing
      // they are added as elements of array and then should be parsed one by another 
      argvStub.config = [{key1: {key9: "value1"}}];
      argvStub.config.push({key1: {key2: 'value'}});
      argvStub.config.push({key3: {key4: 'value5'}});

      var config = cliParser.parse(argvStub);
      expect(config).toEqual({key1:{key9:"value1",key2:"value"},key3:{key4:"value5"}, conf: undefined});
    });
  });
});
