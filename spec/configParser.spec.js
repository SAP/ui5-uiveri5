
var _ = require('lodash');

describe("configParser", function() {
  var logger = require('../src/logger')(3);
  var configParser = require('../src/configParser')(logger);

  it('Should override basic types and objects',function(){
    var config = {
      conf: __dirname + '/configParser/conf.js',  // cofig file with data to override
      provider: {name:'test',key:'value'}};        // comming from command-line

    var mergedConfig = configParser.mergeConfigs(config);
    expect(mergedConfig.provider).toEqual({name:'test',key:'value'});
  });

  it('Should merge arrays in config', function () {
    var config = {
      conf: __dirname + '/configParser/conf.js',  // default config file
      multi: [{name: 'option2'}]
    };

    var mergedConfig = configParser.mergeConfigs(config);

    expect(mergedConfig.multi).toEqual([{name: 'option1'}, {name: 'option2'}]);
  });

  it('Should resolve placeholders in config', function () {
    var config = {
      conf: __dirname + '/configParser/conf.js',
      parameters: {
        test: 'theme',
        rtl: 'rtl'
      },
      osTypeString: 'win64'
    };

    var mergedConfig = configParser.mergeConfigs(config);
    configParser.resolvePlaceholders(mergedConfig);

    expect(mergedConfig.test.key.param).toEqual('sap-ui-theme=sap_theme');
    expect(mergedConfig.test.key.secondParam).toEqual('sap-ui-rtl=true');
  });
});

describe("Should parse confkey from command-line", function () {
  var logger = require('../src/logger')(3);
  var configParser = require('../src/configParser')(logger);
  var cliParser = new require('../src/cliParser')();
  var ArgvStub = function () {
    this._ = [];
  };

  beforeEach(function() {
    delete require.cache[require.resolve('../src/configParser')];
    delete require.cache[require.resolve('../conf/default.conf.js')];
    delete require.cache[require.resolve('../conf/profile.conf.js')];
    delete require.cache[require.resolve('../conf/visual.profile.conf.js')];
  });

  it('Should parse simple object notation in confkey', function () {
    var argvStub = new ArgvStub();
    argvStub.confKeys = 'key2.key2:value';
    var config = configParser.mergeConfigs(argvStub);

    expect(config.key2).toEqual({key2: 'value'});
    expect(config.confKeys).toEqual('key2.key2:value');
    expect(config.confKeys).toEqual(argvStub.confKeys)
  });

  it('Should parse complex object notation in confkey', function () {
    var argvStub = new ArgvStub();
    argvStub.confKeys = 'key1[0].key2:value';
    var config = configParser.mergeConfigs(argvStub);


    expect(config.key1).toEqual([{key2: 'value'}]);
    expect(config.confKeys).toEqual('key1[0].key2:value');
  });

  it('Should parse several simple object notations in confkey object', function () {
    var argvStub = new ArgvStub();
    argvStub.confKeys = ['key1.key2:value','key1.key3:value1'];
    var config = configParser.mergeConfigs(argvStub);

    expect(config.key1).toEqual({key2: 'value',key3: 'value1'});
    expect(config.confKeys).toEqual(['key1.key2:value','key1.key3:value1']);
  });

  it('Should parse several simple object notations in confkey string', function () {
    var argvStub = new ArgvStub();
    argvStub.confKeys = 'key1.key2:value;key1.key3:value1';
    var config = configParser.mergeConfigs(argvStub);

    expect(config.key1).toEqual({key2: 'value',key3: 'value1'});
    expect(config.confKeys).toContain('key1.key2:value;key1.key3:value1');
  });

  it('Should overwrite config.browsers with --browsers', () => {
    var argvStub = new ArgvStub();
    argvStub.browsers = 'firefox';
    var parsed = cliParser.parse(argvStub) 
    parsed.conf = __dirname + '/configParser/conf.js';
    var config = configParser.mergeConfigs(parsed)
    
    expect(config.browsers).toEqual([{"browserName": "firefox"}])
  });

  it('Should overwrite config.browsers with --browsers when not specified', () => {
    var argvStub = new ArgvStub();
    argvStub.browsers = 'firefox';
    var parsed = cliParser.parse(argvStub) 
    parsed.conf = __dirname + '/configParser/empty.conf.js';
    var config = configParser.mergeConfigs(parsed)
    
    expect(config.browsers).toEqual([{"browserName": "firefox"}])
  });

  it('Should overwrite default config.browsers with --browsers and api profile', () => {
    var argvStub = new ArgvStub();
    argvStub.browsers = 'firefox';
    var parsed = cliParser.parse(argvStub) 
    parsed.conf = __dirname + '/configParser/api.conf.js';
    var config = configParser.mergeConfigs(parsed)
    
    expect(config.browsers).toEqual([{"browserName": "firefox"}])
  });

});
