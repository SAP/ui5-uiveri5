var integrationProfile = require('./integration.profile.conf').config;
integrationProfile.api = [
  {name: './api/request'}
];

integrationProfile.matchers = [
  {name: './api/toHaveHttpBody'},
  {name: './api/toHaveHttpHeader'},
  {name: './api/body'}
];

exports.config = integrationProfile;
