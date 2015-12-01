var express = require('express');
var fs = require('fs');
var multer = require('multer');
var upload = multer({});

var app = express();
var dataImage = [];
var imagePath = './localComparisonProvider/Different.png';

var imagesMap = {};
fs.createReadStream(imagePath)
  .on('error', function(error) {
    rejectFn(error);
  })
  .on('data', function(chunk) {
    dataImage.push(chunk);
  })
  .on('end', function() {
     imagesMap['qwerty'] = Buffer.concat(dataImage);
});

imagesMap['asdf'] = '1234';

function getImage(uid) {
  return imagesMap[uid];
}

// List all existing image's uuid's
app.get('/images/', function(req, res) {
  res.send(imagesMap);
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

var uploads = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'json', maxCount: 1 }])

// Save image from given multipart file and json file
app.post('/images', uploads, function(req, res) {
  var files = req.files;
  var imageBuffer = new Buffer(files['image'][0].buffer);
  var jsonBuffer = new Buffer(files['json'][0].buffer);
  var uuid = Math.floor((1 + Math.random()) * 0x10000);

  imagesMap[uuid] = {};

  imagesMap[uuid]['image'] = imageBuffer;
  imagesMap[uuid]['json'] = jsonBuffer;

  var jsonRes = {
    "uuid" : uuid
  };

  res.send(jsonRes);
});

var server = app.listen(8082, function() {
  console.log('Server started');
});

