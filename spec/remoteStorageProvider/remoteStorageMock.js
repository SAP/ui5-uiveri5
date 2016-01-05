var express = require('express');
var multer = require('multer');
var Q = require('q');
var upload = multer({});
var app = express();
var imagesMap = {};

//Constructor
function RemoteStorageMock() {
  function getImage(uid) {
    var uuid = uid.match(/\w+$/g);
    return imagesMap[uuid];
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
    var uuid = req.params['uuid'];

    res.format({
      'image/png': function () {
        res.send(getImage(uuid).buffer);
      }
    });
  });

// Delete image with given uuid
  app.delete('/images/:uuid', function(req, res) {
    var uuid = req.param('uuid');
    delete imagesMap[uuid];
    res.send('Image deleted.');
  });

//var uploads = upload.single('image') <-- for single file, but we need to test it with uploading two files.
  var uploads = upload.fields([{name: 'image', maxCount: 1}, {name: 'json', maxCount: 1}]);

// Save image from given multipart file and json file
  app.post('/images', uploads, function(req, res) {
    var uuid = Math.floor((1 + Math.random()) * 0x10000);
    var files = req.files;
    var imageFile = files.image[0];

    imagesMap[uuid] = {};

    imagesMap[uuid] = imageFile;

    var jsonRes = {
      "uuid" : uuid
    };

    res.status(201).send(jsonRes);
  });
}

RemoteStorageMock.prototype.start = function(){
  return Q.Promise(function(resolveFn,rejectFn) {
    app.listen(8082, function(error) {
      if(error) {
        rejectFn(error);
      } else {
        console.log('Server started');
        resolveFn();
      }
    });
  });
}

module.exports = function(){
  return new RemoteStorageMock();
};
