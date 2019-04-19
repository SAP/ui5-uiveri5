var express = require('express');
var multer = require('multer');
var Q = require('q');
var portfinder = require('portfinder');

//Constructor
function DownloadDriversMock() {
  this.upload = multer({});
  this.app = express();
  this.imagesMap = {};
  this.config = {
    isServiceAvailable: true
  };

  // response for chromedriver
  this.app.get('/LATEST_RELEASE', function(req, res) {
    res.send('1.0');
  });

  this.app.get('/driverVersions.json', function(req, res) {
    res.json({
      chrome: {
        latest: '73'
      }
    });
  });

  this.app.get('/LATEST_RELEASE_73', function(req, res) {
    res.send('73.4');
  });

  // response for geckodriver
  this.app.get('/latest', function(req, res) {
    res.redirect('/geckodriver/2.0');
  });

  // redirect for geckodriver
  this.app.get('/geckodriver/2.0', function(req, res) {
    res.send('/geckodriver/2.0');
  });


}

DownloadDriversMock.prototype.start = function() {
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
  return new DownloadDriversMock();
};
