var express = require('express');
var bodyParser = require('body-parser')

module.exports = function() {
  var app = express();

  var response = 1;
  app.get('/user/', function(req, res) {
    response++;
    res.send({result: response});
  });

  app.use(bodyParser.json());
  app.post('/users/', function(req, res) {
    if(req.body && (req.body.job == 'leader' && req.body.name == 'morpheus')) {
      res.send({status: 'done'});
    } else {
      res.send({status: 'not found'});
    }
  });

  app.get('/users/', function(req, res) {
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

  app.get('/usersWithAuth/', function(req, res) {
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

  app.get('/notFound/', function(req, res) {
    res.status(404).send('Not Found');
  });

  app.delete('/users/:user', function(req, res) {
    res.send({deleted: req.params.user});
  });

  return app;
};
