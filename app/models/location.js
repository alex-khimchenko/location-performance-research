'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash');


var LocationSchema = new Schema({
  name: { type: String, default: 'loc' },
  loc: {
      type: [Number],  // [<longitude>, <latitude>]
      index: '2d'      // create the geospatial index
  },
  nearlyLocatedUsers: [
    this
    //{
    //  type: Schema.Types.ObjectId,
    //  ref: 'Location'
    //}
  ],
  pointsMultiplier: { type: Number, default: 0 },
  points: {type: Number, default: 0},
  whenPointsMultiplierChanged: {type: Number}
});


LocationSchema.statics.getRandomLocation = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    return self.count().then(function(count) {
      var rand = Math.floor(Math.random() * count);

      self.findOne().skip(rand).then(function(data) {
        resolve(data._id)
      });
    }).catch(function(err) {
      console.error('find random circle error: ', err);

      return reject(err)
    });
  });
};

LocationSchema.statics.getNRandomLocations = function(number) {
  var self = this;
  var promiseArr = [];

  return new Promise(function(resolve, reject) {
    return self.count().then(function(count) {

      for(var i = 0; i < number; i++) {
        var rand = Math.floor(Math.random() * count);

        promiseArr.push(self.findOne().skip(rand))
      }

      return Promise.all(promiseArr).then(function(data) {
        resolve(_.uniq(_.map(data, function(d) { return d._id.toString()})));
      });
    }).catch(function(err) {
      console.error('find random circle error: ', err);

      return reject(err)
    });
  });
};

LocationSchema.methods.calculateMultiplierAfterInsert = function() {
  var self = this;
  var promiseArr = [];

  var uid = self._id;
  var loc = self.loc;

  var scoreMultiplier = 0;
  var newNearlyLocated = [];
  var locChangedTime = Number(new Date());

  var sphereRadius = 0.032/3963.2;


  return new Promise(function(resolve, reject) {
    return self.model('Circle').getMemberCircles(uid).then(function(circles) {

      _.each(circles, function(circle) {
        var idsSlice = _.reject(circle.members, mongoose.Types.ObjectId(uid));

        promiseArr.push(self.model('Location').find({
          '_id': { $in: idsSlice },
          loc: {
            $geoWithin: {
              $centerSphere: [ loc, sphereRadius ]
            }
          }
        }));
      });

      return Promise.all(promiseArr).then(function(data) {

        _.each(data, function(d) {
          if (d.length > 0) {
            scoreMultiplier++; // there are some nearly located members in this circle, incrementing score multiplier

            _.each(d, function(newNearlyLocatedMember) {
              if (!newNearlyLocated.some(id=> id.equals(newNearlyLocatedMember._id))) {
                newNearlyLocated.push(newNearlyLocatedMember._id)
              }
            })
          }
        });

        self.nearlyLocatedUsers = newNearlyLocated;
        self.pointsMultiplier = scoreMultiplier;
        self.loc = loc;
        self.whenPointsMultiplierChanged = locChangedTime;

        return self.save().then(function(data) { resolve(data) });
      })

    }).catch(function(err) {
      console.error('err: ', err);
      reject(err);
    });
  });


};

LocationSchema.statics.incrementMultiplier = function(incObj, idToIncrement, timeStamp) {

  // increment multiplier
  // update whenPointsMultiplierChanged
  // add member id to nearlyLocatedUsers
  var self = this;
  var promiseArr = [];

  return new Promise(function(resolve,reject) {

    _.forOwn(incObj, function(value, key) {
      promiseArr.push(
        self.update(
          {
            '_id': {$in: value}
          }, {
            $set: { whenPointsMultiplierChanged: timeStamp },
            $inc: { pointsMultiplier: +key },
            $addToSet: { nearlyLocatedUsers: mongoose.Types.ObjectId(idToIncrement) }
          }, {
            multi: true
          }
        )
      );
    });

    Promise.all(promiseArr).then(function(data) {
      resolve(data);
    }).catch(function(err) {
      console.error('err: ', err);
      reject(err);
    });

  });
};

LocationSchema.statics.decrementMultiplier = function(decObj, idToDecrement, timeStamp) {

  // decrement multiplier
  // update whenPointsMultiplierChanged
  // remove member id from nearlyLocatedUsers
  var self = this;
  var promiseArr = [];

  return new Promise(function(resolve,reject) {
    _.forOwn(decObj, function(value, key) {
      promiseArr.push(
        self.update(
          {
            '_id': {$in: value}
          }, {
            $set: { whenPointsMultiplierChanged: timeStamp },
            $inc: { pointsMultiplier: - +key },
            $pull: { nearlyLocatedUsers: mongoose.Types.ObjectId(idToDecrement) }
          }, {
            multi: true
          }
        )
      );
    });

    Promise.all(promiseArr).then(function(data) {
      resolve(data);
    }).catch(function(err) {
      console.error('err: ', err);
      reject(err);
    });


  });

};


mongoose.model('Location', LocationSchema);