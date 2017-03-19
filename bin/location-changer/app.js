'use strict';

var cluster = require('cluster');

cluster.setupMaster({
  exec: __dirname + '/worker.js'
});

cluster.on('online', function (worker) {
  console.log('Worker ' + worker.process.pid + ' is alive');
});

cluster.on('exit', function (worker, code, signal) {
  console.log('Worker ' + worker.process.pid + ' died');
});

cluster.fork({
  forkIndex: 0,
  numberOfForks: 1
});
