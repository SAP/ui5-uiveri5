
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
});
