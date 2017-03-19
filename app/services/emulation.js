'use strict';

const rp = require('request-promise');
const mongoose = require('mongoose');
const Location = mongoose.model('Location');
const Circle = mongoose.model('Circle');


var emulator = {
  sendTest: function() {
    var options = {
      method: 'POST',
      uri: 'http://localhost:3000/ping',
      body: {
        some: 'payload'
      },
      json: true
    };

    return rp(options)
      .then(function(data) {
        console.log(data)
      }).catch(function(err) {
        console.error('error while request promise: ', err);
      });

  },

  emulateLocationChange: function() {

    console.time('locationChange');
    // new location random coordinates;
    var austinCoords = [97.7431, 30.2672]; //location sample
    var long1000Feet = 0.00347;
    var lat1000Feet = 0.00275;

    var newCoords = [
      (austinCoords[0] + Math.random()*long1000Feet).toFixed(6),
      (austinCoords[1] + Math.random()*lat1000Feet).toFixed(6)
    ];

    return Circle.getRandomLocation()
      .then(function(id) {

        console.log('randCircle location id: ', id);

        var options = {
          method: 'POST',
          uri: 'http://localhost:3000/changeLocation',
          body: {
            id: id,
            loc: newCoords
          },
          json: true
        };

        return rp(options)
          .then(function(data) {
            console.timeEnd('locationChange');
            //console.log(data)
          }).catch(function(err) {
            console.error('error while request promise: ', err);
          });
      })
      .catch(function(err) {
        console.error('err: ', err)
      });
  }
};

module.exports = emulator;