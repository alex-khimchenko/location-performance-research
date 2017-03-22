'use strict';

const mongoose = require('mongoose');
const Location = mongoose.model('Location');
const Circle = mongoose.model('Circle');
const _ = require('lodash');

var emulator = require('../services/emulation');

function getRandomColor(){
  var color =  "#" + (Math.random() * 0xFFFFFF << 0).toString(16);
  return color;
}

var homeController = {

  index: function (req, res) {
    res.render('home/index', {
      title: 'bthere-test'
    });
  },

  clearDB: function (req, res) {
    return Circle.remove({}).then(function(removeCircleData) {
      return Location.remove({}).then(function(removeLocationData) {
        res.status(200).json({data: [removeCircleData, removeLocationData]})
      })
    }).catch(function(err) {
      res.status(200).json({err: err});
    });
  },

  createTestCircle: function (req, res) {
    Circle.createTestCircle('1').then(function(data) {
      var promiseArr = [];

      return Location.find({}).then(function(locs) {
        _.each(locs, function(loc) {
          promiseArr.push(loc.calculateMultiplierAfterInsert())
        });

        return Promise.all(promiseArr).then(function(data) {
          res.status(200).json({data: data})
        });
      });


    });
  },

  populateTestCircles: function (req, res) {
    var creationAmount = req.body.amount;
    var start = req.body.from;
    var populateFunctions = [];

    Circle.createTestCircle(1).then(function() {

      for(var i = 2; i <= creationAmount; i++) {
        populateFunctions.push((Circle.createTestCircleWithExistingLocations(i + +start)))
      }

      Promise.all(populateFunctions)
        .then(function() {
          var promiseArr = [];

          return Location.find({}).then(function(locs) {
            _.each(locs, function(loc) {
              promiseArr.push(loc.calculateMultiplierAfterInsert())
            });

            return Promise.all(promiseArr);
          });
        })

        .then(function (data) {
          res.status(200).json({status: 'ok'});
        })
        .catch(function(error) {
          console.error(error);
          res.status(200).json({err: error});
        });
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
    var locationsNotToIncrementMultiplier = [];

    var usersNotToDecrement = [];
    var usersToDecrement = [];


    var locChangedTime = Number(new Date());

    //console.log(req.body, typeof req.body);
    Location.findById(uid).populate('nearlyLocatedUsers').then(function(locData) {
      return Circle.getMemberCircles(uid).then(function(circles) {
        var dataObj = {};

        _.each(locData.nearlyLocatedUsers, function(usr) {
          dataObj[usr._id] = _.map(_.reject(usr.nearlyLocatedUsers, locData._id), String);
        });

        _.each(circles, function(circle) {
          _.each(circle.members, function(member) {
            if (dataObj[member]) {
              var found = circle.members.some(id=> dataObj[member].indexOf(id.toString()) >= 0);
              if (found) {
                usersNotToDecrement.push(member);
              } else {
                usersToDecrement.push(member.toString());
              }
            }
          });

          promiseArr.push(circle.getNearlyMembersForLocation(uid, newLocation))
        });

        return Promise.all(promiseArr).then(function(data) {
          _.each(data, function(d) {
            if (d.length > 0) {
              scoreMultiplier++; // there are some nearly located members in this circle, incrementing score multiplier

              _.each(d, function(newNearlyLocatedMember) {
                newNearlyLocated.push({id: newNearlyLocatedMember._id, notToIncrement: newNearlyLocatedMember.notToIncrement})
              })
            }
          });

          var previousNearlyLocated = _.map(locData.nearlyLocatedUsers, '_id').map(String);

          _.each(newNearlyLocated, function(newNearlyLocatedMember) {
            var memberId = newNearlyLocatedMember.id;

            if (previousNearlyLocated.indexOf(memberId.toString()) !== -1) {
              // the new nearly located member was also nearby before location change
              _.pull(usersToDecrement, memberId.toString()); // remove from previously located to get who's left later

            } else {
              // the new nearly located member wasn't nearby, need to update this member's multiplier and locChangedTime too
              if (!newNearlyLocatedMember.notToIncrement) {
                locationsToIncrementMultiplier.push(newNearlyLocatedMember.id);
              } else {
                locationsNotToIncrementMultiplier.push(newNearlyLocatedMember.id)
              }
            }
          });

          var uniqueIds = [];

          _.each(newNearlyLocated, function(member) {
            var uid = member.id;

            if(!uniqueIds.some(id=> uid.equals(id))) {
              uniqueIds.push(uid);
            }
          });

          locData.nearlyLocatedUsers = uniqueIds;
          locData.pointsMultiplier = scoreMultiplier;
          locData.loc = newLocation;
          locData.whenPointsMultiplierChanged = locChangedTime;


          var incObj = _.invertBy(_.countBy(locationsToIncrementMultiplier));

          if (locationsNotToIncrementMultiplier.length > 0) {
            incObj['0'] = locationsNotToIncrementMultiplier;
          }

          var decObj = _.invertBy(_.countBy(usersToDecrement));

          if(usersNotToDecrement.length > 0) {
            decObj['0'] = usersNotToDecrement;
          }

          return Promise.all([
            // update location with new data
            locData.save(),
            // update all locations which appeared nearby
            Location.incrementMultiplier(incObj, uid, locChangedTime),
            // update all locations which are not nearby anymore
            Location.decrementMultiplier(decObj, uid, locChangedTime)
          ]).then(function(data) {
            console.timeEnd('updateLocation');
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
  },

  visualize: function (req, res) {

    var pi = Math.PI;

    var austinCoords = [97.7431, 30.2672];
    var long1000Feet = 0.00347;
    var lat1000Feet = 0.00275;

    var locationObj = {};

    Circle.find({}).populate('members').lean().then(function(circleData) {
      _.each(circleData, function(data) {

        var members = data.members;

        var color = getRandomColor();

        _.each(members, function(d) {

          var existing = locationObj[d._id];

          if (existing) {
            return locationObj[d._id].color.push(color);
          }

          var newLon = (d.loc[0] - austinCoords[0]) / long1000Feet * 500;
          var newLat = (d.loc[1] - austinCoords[1]) / lat1000Feet * 500;

          d.loc = [newLon, newLat];
          d.color = color;

          locationObj[d._id] = {
            id: d._id,
            color: [color],
            loc: [newLon, newLat],
            name: d.name
          }

        });
      });

      var finalArr = [];

      _.each(_.values(locationObj), function(item) {
        var colorsNumber = item.color.length;

        for (var i = 0; i < colorsNumber; i++) {
          finalArr.push({
            name: item.name,
            color: item.color[i],
            loc: item.loc,
            startAngle: i * (1/colorsNumber) * 2 * pi,
            endAngle: (i + 1) * (1/colorsNumber) * 2 * pi
          })
        }

      });

      res.status(200).send({points: finalArr});
    });
  }
};

module.exports = homeController;
