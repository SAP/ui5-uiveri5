exports.config = {
  profile: 'integration',
  matchers: [
    {name: './api/toHaveHttpBody'},
    {name: './api/toHaveHttpHeader'},
    {name: './api/body'}
  ],
  plugins: [
    {name: '../src/api/requestPlugin'}
  ]
};
