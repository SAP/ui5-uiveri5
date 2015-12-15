
describe("RuntimeResolver", function() {
  var ModuleLoader = require('../src/ModuleLoader');
  var logger = require('../src/logger')(3);

  it("Should load modules defined with name", function() {
    var config = {test: __dirname + '/moduleLoader/testModule'};
    var param = {key:'value'};

    var loader = new ModuleLoader(config,logger);
    var module = loader.loadModule('test',[param]);

    expect(module.config).toBe(config);
    expect(module.instanceConfig).toEqual({});
    expect(module.logger).toBe(logger);
    expect(module.mockParam).toBe(param);
  });

  it("Should load modules defined with object", function() {
    var config = {test: {name: __dirname + '/moduleLoader/testModule',key1:'value1'}};
    var param = {key:'value'};

    var loader = new ModuleLoader(config,logger);
    var module = loader.loadModule('test',[param]);

    expect(module.config).toBe(config);
    expect(module.instanceConfig).toEqual({key1:'value1'});
    expect(module.logger).toBe(logger);
    expect(module.mockParam).toBe(param);
  });

  it("Should load module arrays", function() {
    var config = {test: [{
      name: __dirname + '/moduleLoader/testModule',key1:'value1'},{
      name: __dirname + '/moduleLoader/testModule',key2:'value2'
    }]};
    var param = {key:'value'};

    var loader = new ModuleLoader(config,logger);
    var modules = loader.loadModule('test',[param]);

    expect(modules[0].config).toBe(config);
    expect(modules[0].instanceConfig).toEqual({key1:'value1'});
    expect(modules[0].logger).toBe(logger);
    expect(modules[0].mockParam).toBe(param);
    expect(modules[1].config).toBe(config);
    expect(modules[1].instanceConfig).toEqual({key2:'value2'});
    expect(modules[1].logger).toBe(logger);
    expect(modules[1].mockParam).toBe(param);
  });

  it("Should load named modules", function() {
    var config = {test: 'test',testConfigs: {test:{name:__dirname + '/moduleLoader/testModule',key1:'value1'}}};
    var param = {key:'value'};

    var loader = new ModuleLoader(config,logger);
    var module = loader.loadNamedModule('test',[param]);

    expect(module.config).toBe(config);
    expect(module.instanceConfig).toEqual({key1:'value1'});
    expect(module.logger).toBe(logger);
    expect(module.mockParam).toBe(param);
  });

  it("Should load named modules and merge params", function() {
    var config = {test: {'testModule':{key2:'value2'}},testConfigs: {testModule:{name:__dirname + '/moduleLoader/testModule',key1:'value1'}}};
    var param = {key:'value'};

    var loader = new ModuleLoader(config,logger);
    var module = loader.loadNamedModule('test',[param]);

    expect(module.config).toBe(config);
    expect(module.logger).toBe(logger);
    expect(module.mockParam).toBe(param);
    expect(module.instanceConfig).toEqual({key1:'value1',key2:'value2'});
  });
});
