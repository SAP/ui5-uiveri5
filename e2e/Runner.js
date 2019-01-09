var portfinder = require('portfinder');
var child_process = require('child_process');
var path = require('path');
var express = require('express');
var http = require('http');
var path = require('path');

module.exports = class Runner {
    static findFreePort() {
        return new Promise(function (resolveFn, rejectFn) {
            portfinder.getPort(function (err, port) {
              if (err) {
                rejectFn(err);
              } else {
                resolveFn(port);
              }
            });
        });
    }

    static startApp(root) {
      return this.findFreePort().then((port) => {
        let app = express();
        app.use(express.static(path.join(__dirname + root)));
        let appServer = http.createServer(app);
        appServer.listen(port);
        let appHost = 'http://localhost:' + port;
        console.log('App started at: ' + appHost);
        return {server: appServer,host: appHost};
      });
    }

    static execTest(opts) {
      let cwd = path.join(__dirname);
      console.log('cwd: ' + cwd);
      return new Promise((resolve,reject) => {
        var cmdString = [
          'node',
          '../bin/uiveri5',
          '-v',
          '--browsers=chromeHeadless',
          '--config.specResolver="./resolver/localSpecResolver"',
          '--config.specs=' + opts.specs,
          '--config.baseUrl=' + opts.baseUrl,
          opts.confjs ? opts.confjs : ''
        ].join(" ");
        console.log('Starting cmd: ' + cmdString);
        var proc = child_process.exec(cmdString,{
            cwd: cwd,
            maxBuffer: 1024 * 500
          }
        );

        proc.stdout.on('data', (data) => {
          console.log(`uiveri5 console: ${data}`);
        });

        proc.stderr.on('data', (data) => {
          console.log(`uiveri5 console: ${data}`);
        });

        proc.on('exit', (code) => {
          console.log('uiveri5 exited with code: ' + code );
          if (code == 0) {
            resolve();
          } else {
            reject("uiveri5 exited with error: " + code);
          }
        });

        proc.on('error', (error) => {
          console.log(`uiveri5 failed to start, reason:  ${error}`);
          reject(error);
        });
      });
    }
  };
  