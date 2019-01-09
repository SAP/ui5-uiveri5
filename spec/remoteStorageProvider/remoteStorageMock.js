var express = require('express');
var multer = require('multer');
var Q = require('q');
var portfinder = require('portfinder');

//Constructor
function RemoteStorageMock() {
  this.upload = multer({});
  this.app = express();
  this.imagesMap = {};
  this.config = {
    isServiceAvailable: true
  };

  var that = this;
  function getImage(uid) {
    return that.imagesMap[uid];
  }

  this.app.use('*', function (req, res, next) {
    if (that.config.isServiceAvailable) {
      next();
    } else {
      res.sendStatus(503);
    }
  });

  // List all existing image's uuid's
  this.app.get('/images/', function(req, res) {
    var uuids = [];

    for(var key in that.imagesMap) {
      uuids.push(key);
    }

    res.send(uuids);
  });

  // Get the image with given uuid
  this.app.get('/images/:uuid', function(req, res) {
    var uuid = req.params['uuid'];
    var image = getImage(uuid);

    if (image) {
      res.format({
        'image/png': function () {
          res.send(image.buffer);
        }
      });
    } else {
      res.sendStatus(404);
    }
  });

  // Delete image with given uuid
  this.app.delete('/images/:uuid', function(req, res) {
    var uuid = req.param('uuid');
    delete that.imagesMap[uuid];
    res.send('Image deleted.');
  });

  //var uploads = upload.single('image') <-- for single file, but we need to test it with uploading two files.
  var uploads = this.upload.fields([{name: 'image', maxCount: 1}, {name: 'json', maxCount: 1}]);

  // Save image from given multipart file and json file
  this.app.post('/images', uploads, function(req, res) {
    var uuid = Math.floor((1 + Math.random()) * 0x10000);
    var files = req.files;
    var imageFile = files.image[0];

    that.imagesMap[uuid] = imageFile;

    var jsonRes = {
      "uuid" : uuid.toString()
    };

    res.status(201).send(jsonRes);
  });
}

RemoteStorageMock.prototype.start = function() {
  var that = this;
  return Q.Promise(function (resolveFn, rejectFn) {
    portfinder.getPort(function (err, port) {
      if (err) {
        rejectFn(err);
      } else {
        that.app.listen(port, function (error) {
          if (error) {
            rejectFn(error);
          } else {
            console.log('Server started');
            resolveFn(port);
          }
        });
      }
    });
  });
};

module.exports = function(){
  return new RemoteStorageMock();
};
