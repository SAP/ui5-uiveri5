var path = require('path');

exports.config = {
  profile: path.join(__dirname, 'referred.conf.js'),
  prop: [{name: 'optionToUpdate', newKey: "value1", updateKey: "newValue"}]
};
