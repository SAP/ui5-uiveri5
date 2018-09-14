var express = require('express');
var Q = require('q');
var portfinder = require('portfinder');
var bodyParser = require('body-parser');

//Constructor
function RestServiceMock() {
  this.app = express();


  var response = 1;
  this.app.get('/user/', function(req, res) {
    response++;
    res.send({result: response});
  });

  this.app.use(bodyParser.json());
  this.app.post('/users/', function(req, res) {
    if(req.body && (req.body.job == 'leader' && req.body.name == 'morpheus')) {
      res.send({status: 'done'});
    } else {
      res.send({status: 'not found'});
    }
  });

  this.app.get('/users/', function(req, res) {
    var response = [{user1: 'testUser1'},{user2: 'testUser2'}];
    res.set('Content-Type', 'application/json');
    if(req.query) {
      if(req.query.user && (req.query.user == 'user1')) {
        response = [{user1: 'testUser1'}];

        res.send(response);
      } else if(req.query.delay) {
        var delay = req.query.delay;

        setTimeout(function() {
          res.send({result: delay});
        }, delay)
      } else {
        res.send(response);
      }
    }
  });

  this.app.get('/notFound/', function(req, res) {
    res.status(404).send('Not Found');
  });

  this.app.delete('/users/:user', function(req, res) {
    res.send({deleted: req.param('user')});
  });

  this.app.get('/usersWithAuth/', function(req, res) {
    var auth = req.headers['authorization'];
    if(auth) {
      var tmp = auth.split(' ');

      var buf = new Buffer(tmp[1], 'base64');
      var plain_auth = buf.toString();

      var creds = plain_auth.split(':');
      var username = creds[0];
      var password = creds[1];

      if((username == 'testUser') && (password == 'testPass')) {

        res.send({status: 'Authenticated'});
      }
    } else {
      res.status(401).send('Unauthorized');
    }

  });
}

RestServiceMock.prototype.start = function() {
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
  return new RestServiceMock();
};
