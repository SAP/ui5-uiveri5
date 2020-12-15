var plugin = require.resolve('./fixture/plugin')

exports.config = {
  plugins: [{
    name: plugin
  }]
};
