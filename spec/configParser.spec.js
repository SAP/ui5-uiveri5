
var _ = require('lodash');
var logger = require('../src/logger');
var configParser = require('../src/configParser')(logger);
var cliParser = new require('../src/cliParser')();

describe("configParser", function() {

  beforeEach(function () {
    configParser.config = {};
  });

  it('Should override object values', function () {
    var config = {
      conf: __dirname + '/configParser/conf.js', // config file with data to override
      provider1: {key1: 'test', key2: 'value'}, // comming from command-line
      provider2: {key1: 'test', key2: 'value'}
    };

    var mergedConfig = configParser.mergeConfigs(config);
    expect(mergedConfig.provider1).toEqual({key1: 'test', key2: 'value'});
    expect(mergedConfig.provider2).toEqual({key1: 'test', key2: 'value'});
  });

  it('Should merge arrays in config', function () {
    var config = {
      conf: __dirname + '/configParser/conf.js',  // default config file
      multi: [{name: 'option2'}]
    };

    var mergedConfig = configParser.mergeConfigs(config);

    expect(mergedConfig.multi).toEqual([{name: 'option2'}, {name: 'option1'}]);
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

  it('Should merge imported test params', function () {
    var cliConfig = {
      conf: __dirname + '/configParser/conf.js',  // default config file
      paramsFile: __dirname + '/configParser/testParams.json',
      params: {
        param2: 'newValue'
      }
    };

    var mergedConfig = configParser.mergeConfigs(cliConfig);

    expect(mergedConfig.params).toEqual({param1: 'value1', param2: 'newValue'});
  });
});

describe("Should parse confkey from command-line", function () {
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

  it('Should parse array values in confkey string', function () {
    var argvStub = new ArgvStub();
    argvStub.confKeys = 'key1[0].key2:[opt1, opt2];browsers[0].capabilities.chromeOptions.args:[--window-size=700,800, --headless]';
    var config = configParser.mergeConfigs(argvStub);

    expect(config.key1).toEqual([{key2: ["opt1", "opt2"]}]);
    expect(config.browsers).toEqual([{capabilities: {chromeOptions: {args: ["--window-size=700,800", "--headless"]}}}]);
    expect(config.confKeys).toEqual(argvStub.confKeys);
  });

  it('Should overwrite specs with --specs', function () {
    var config = {
      conf: __dirname + '/configParser/conf.js', // config file with data to override
      specs: ['newvalue'] // comming from command-line
    };

    var mergedConfig = configParser.mergeConfigs(config);
    expect(mergedConfig.specs).toEqual(['newvalue']);
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
    parsed.conf = __dirname + '/configParser/importing.conf.js';
    var config = configParser.mergeConfigs(parsed)

    expect(config.browsers).toEqual([{"browserName": "firefox"}])
  });

  it('Should combine enabled modules', function () {
    var config = {
      conf: __dirname + '/configParser/modulecrud.conf.js',
      enableKey: {
        enabled: [{name: 'optionToEnable-key'}] // keys in both configs
      },
      enableArr: [{name: 'optionToEnable-arr'}], // arrays in both configs
      enableMix1: {
        enabled: [{name: 'optionToEnable-key'}] // key in high prio, array in low prio
      },
      enableMix2: [{name: 'optionToEnable-arr'}] // array in high prio, key in low prio
    };

    var mergedConfig = configParser.mergeConfigs(config);

    expect(mergedConfig.enableKey).toEqual([{name: 'optionToEnable-key'}, {name: 'optionToEnable-file'}]);
    expect(mergedConfig.enableArr).toEqual([{name: 'optionToEnable-arr'}, {name: 'optionToEnable-file'}]);
    expect(mergedConfig.enableMix1).toEqual([{name: 'optionToEnable-key'}, {name: 'optionToEnable-file'}]);
    expect(mergedConfig.enableMix2).toEqual([{name: 'optionToEnable-arr'}, {name: 'optionToEnable-file'}]);
  });

  it('Should disable modules', function () {
    var config = {
      conf: __dirname + '/configParser/modulecrud.conf.js',
      disableArr: {
        disabled: [{name: 'optionToDisable'}]
      },
      disableKey: {
        disabled: [{name: 'optionToDisable'}]
      }
    };

    var mergedConfig = configParser.mergeConfigs(config);

    expect(mergedConfig.disableArr).toEqual([{name: 'optionToRemain'}]);
    expect(mergedConfig.disableKey).toEqual([{name: 'optionToRemain'}]);
  });

  it('Should update existing modules', function () {
    var config = {
      conf: __dirname + '/configParser/modulecrud.conf.js',
      updateArr: [{name: 'optionToUpdate', newKey: "value1", updateKey: "newValue"}],
      updateKey: {
        enabled: [{name: 'optionToUpdate', newKey: "value1", updateKey: "newValue"}]
      }
    };

    var mergedConfig = configParser.mergeConfigs(config);
    expect(mergedConfig.updateArr).toEqual([{name: 'optionToUpdate', updateKey: "newValue", newKey: "value1", existingKey: "value2"}]);
    expect(mergedConfig.updateKey).toEqual([{name: 'optionToUpdate', updateKey: "newValue", newKey: "value1", existingKey: "value2"}]);
  });

  it('Should not update existing module with different ID', function () {
    var config = {
      conf: __dirname + '/configParser/modulecrud.conf.js',
      updateArrID: [{name: 'optionWithID1', newKey: "value1", updateKey: "newValue", id: "newID"}],
      updateKeyID: {
        enabled: [{name: 'optionWithID2', newKey: "value1", updateKey: "newValue", id: "newID"}]
      }
    };

    var mergedConfig = configParser.mergeConfigs(config);
    expect(mergedConfig.updateArrID).toEqual([
      {name: 'optionWithID1', updateKey: "newValue", newKey: "value1", id: "newID"},
      {name: 'optionWithID1', updateKey: "prevValue", existingKey: "value2", id: "prevID"}
    ]);
    expect(mergedConfig.updateKeyID).toEqual([
      {name: 'optionWithID2', updateKey: "newValue", newKey: "value1", id: "newID"},
      {name: 'optionWithID2', updateKey: "prevValue", existingKey: "value2", id: "prevID"}
    ]);
  });

  it('Should refer to another profile - built-in profile', function () {
    var config = {
      conf: __dirname + '/configParser/builtinProfile.conf.js'
    };

    var mergedConfig = configParser.mergeConfigs(config);
    // with decreasing prio: builtInProfile -> integration
    expect(mergedConfig.profile).toContain('integration');
    expect(mergedConfig.prop).toEqual([{name: 'module', key: "value1"}])
    expect(mergedConfig.specResolver).toEqual('./resolver/localSpecResolver');
  });

  it('Should refer to another profile - file', function () {
    var config = {
      conf: __dirname + '/configParser/referring.conf.js'
    };

    var mergedConfig = configParser.mergeConfigs(config);
    // with decreasing prio: refering -> referred -> api -> integration
    expect(mergedConfig.profile).toContain('referred');
    expect(mergedConfig.prop).toEqual([{name: 'optionToUpdate', updateKey: "newValue", newKey: "value1", existingKey: "value2"}])
    expect(mergedConfig.plugins).toContain({name: '../src/api/requestPlugin'});
    expect(mergedConfig.specResolver).toEqual('./resolver/localSpecResolver');
  });

});
