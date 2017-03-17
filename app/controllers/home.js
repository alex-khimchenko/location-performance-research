'use strict';

const mongoose = require('mongoose');
const Location = mongoose.model('Location');
const Circle = mongoose.model('Circle');
const _ = require('lodash');

var emulator = require('../services/emulation');

var homeController = {

  index: function (req, res) {
    res.render('home/index', {
      title: 'Node Express Mongoose Boilerplate'
    });
  },

  createTestCircle: function (req, res) {
    Circle.createTestCircle('1').then(function(data) {
      res.status(200).json({status: 'ok'})
    });
  },

  populateTestCircles: function (req, res) {
    var creationAmount = req.body.amount;
    var start = req.body.from;
    var populateFunctions = [];

    for(var i = 1; i <= creationAmount; i++) {
      populateFunctions.push((Circle.createTestCircle(i + +start)))
    }

    Promise.all(populateFunctions)
      .then(function () {
        res.status(200).json({status: 'ok'});
      })
      .catch(function(error) {
        res.status(200).json({err: error});
      });
  },

  getNearMath: function (req, res) {
    return Circle.getNearMath()
      .then(function(data) {
        res.status(200).json(data);
      })
      .catch(function(err) {
        console.error(err);
        res.status(200).json({err: err});
      });
  },

  getNearDBIndex: function (req, res) {
    return Circle.getNearDBIndex('near')
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
        console.error(err);
        res.status(200).json({err: err});
    });
  },

  getGeoWithinDBIndex: function (req, res) {
    return Circle.getNearDBIndex('geoWithin')
      .then(function(data) {
        res.status(200).json(data);
      })
      .catch(function(err) {
        console.error(err);
        res.status(200).json({err: err});
      });
  },

  getNearEntireCircle: function (req, res) {
    return Circle.getNearEntireCircle()
      .then(function(data) {
        res.status(200).json(data);
      })
      .catch(function(err) {
        console.error(err);
        res.status(200).json({err: err});
      });
  },

  emulateLocationChange: function (req, res) {
    emulator.emulateLocationChange();
    res.status(200).send('ok')
  },

  changeLocation: function (req, res) {
    console.time('updateLocation');

    var uid = req.body.id;

    var newLocation = req.body.loc;
    var promiseArr = [];

    var scoreMultiplier = 0;
    var newNearlyLocated = [];
    var locationsToIncrementMultiplier = [];
    var locChangedTime = Number(new Date());

    console.log(req.body, typeof req.body);
    Location.findById(uid).then(function(locData) {
      return Circle.getMemberCircles(uid)
      .then(function(circles) {
        _.each(circles, function(circle) {
          promiseArr.push(circle.getNearlyMembersForLocation(uid, newLocation))
        });

        return Promise.all(promiseArr).then(function(data) {
          _.each(data, function(d) {
            if (d.length > 0) {
              scoreMultiplier++; // there are some nearly located members in this circle, incrementing score multiplier

              _.each(d, function(newNearlyLocatedMember) {
                newNearlyLocated.push(newNearlyLocatedMember._id)
              })
            }
          });

          var newNearlyLocatedArr = _.uniq(newNearlyLocated);
          var previousNearlyLocated = locData.nearlyLocatedUsers;

          _.each(newNearlyLocatedArr, function(memberId) {
            if (previousNearlyLocated.indexOf(memberId) !== -1) {
              // the new nearly located member was also nearby before location change
              _.pull(previousNearlyLocated, memberId); // remove from previously located to get who's left later
            } else {
              // the new nearly located member wasn't nearby, need to update this member's multiplier and locChangedTime too
              locationsToIncrementMultiplier.push(memberId);
            }
          });

          locData.nearlyLocatedUsers = newNearlyLocatedArr;
          locData.pointsMultiplier = scoreMultiplier;
          locData.loc = newLocation;
          locData.whenPointsMultiplierChanged = locChangedTime;

          return Promise.all([
            // update location with new data
            locData.save(),
            // update all locations which appeared nearby
            Location.incrementMultiplier(locationsToIncrementMultiplier, uid, locChangedTime),
            // update all locations which are not nearby anymore
            Location.decrementMultiplier(previousNearlyLocated, uid, locChangedTime)
          ]).then(function(data) {
            console.timeEnd('updateLocation');
            console.log('final: ', data)
          });
        });
      });
    }).catch(function(error) {
      console.error(error);
    });

    res.status(200).send('ok')
  },

  ping: function (req, res) {
    console.log('PING');
  },

  sendPing: function (req, res) {
    emulator.sendTest();
    res.status(200).send('ok')
  }
};

module.exports = homeController;
