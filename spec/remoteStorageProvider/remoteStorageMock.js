
var express = require('express');
var multer = require('multer');
var upload = multer({});

var app = express();
var imagesMap = {};

function getImage(uid) {
  return imagesMap[uid];
}

// List all existing image's uuid's
app.get('/images/', function(req, res) {
  var uuids = [];

  for(var key in imagesMap) {
    uuids.push(key);
  }

  res.send(uuids);
});

// Get the image with given uuid
app.get('/images/:uuid', function(req, res) {
  var uuid = req.param('uuid');
  res.send(getImage(uuid));
});

// Delete image with given uuid
app.delete('/images/:uuid', function(req, res) {
  var uuid = req.param('uuid');
  delete imagesMap[uuid];
  res.send('Image deleted.');
});

var uploads = upload.single('image')

// Save image from given multipart file and json file
app.post('/images', uploads, function(req, res) {
  var uuid = Math.floor((1 + Math.random()) * 0x10000);
  var file = req.file;
  var imageBuffer = new Buffer(file.buffer);

  imagesMap[uuid] = {};

  imagesMap[uuid] = imageBuffer;

  var jsonRes = {
    "uuid" : uuid
  };

  res.send(jsonRes);
});

var server = app.listen(8082, function() {
  console.log('Server started');
});

