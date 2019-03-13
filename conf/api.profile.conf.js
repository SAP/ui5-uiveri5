var profile = require('./profile.conf').config;

profile.matchers = profile.matchers.concat(
  {name: './api/toHaveHttpBody'},
  {name: './api/toHaveHttpHeader'},
  {name: './api/body'}
);

profile.plugins.push({name: '../src/api/requestPlugin'});

exports.config = profile;
