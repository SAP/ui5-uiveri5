var baseProfile = require('./integration.profile.conf').config;

baseProfile.matchers = [
  {name: './api/toHaveHttpBody'},
  {name: './api/toHaveHttpHeader'},
  {name: './api/body'}
];

baseProfile.plugins = [
  {name: '../src/api/requestPlugin'}
];

exports.config = baseProfile;
