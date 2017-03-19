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

LocationSchema.statics.incrementMultiplier = function(ids, idToIncrement, timeStamp) {

  // increment multiplier
  // update whenPointsMultiplierChanged
  // add member id to nearlyLocatedUsers
  var self = this;

  return new Promise(function(resolve,reject) {

    return self.update(
      {
        '_id': {$in: ids}
      }, {
        $set: { whenPointsMultiplierChanged: timeStamp },
        $push: { nearlyLocatedUsers: mongoose.Types.ObjectId(idToIncrement) },
        $inc: { pointsMultiplier: 1 }
      }, {
        multi: true
      }
    ).then(function(data) {
        resolve(data);
        //console.log('bulk update increment locations: ', data)
      }).catch(function(err) {
        console.error('err: ', err);
        reject(err)
      });
  });
};

LocationSchema.statics.decrementMultiplier = function(ids, idToDecrement, timeStamp) {

  // decrement multiplier
  // update whenPointsMultiplierChanged
  // remove member id from nearlyLocatedUsers
  var self = this;

  return new Promise(function(resolve,reject) {
    return self.update(
      {
        '_id': {$in: ids}
      }, {
        $set: { whenPointsMultiplierChanged: timeStamp },
        $inc: { pointsMultiplier: -1 },
        $pull: { nearlyLocatedUsers: mongoose.Types.ObjectId(idToDecrement) }
      }, {
        multi: true
      }
    ).then(function(data) {
        //console.log('bulk update decrement locations', data)
        resolve(data);
      }).catch(function(err) {
        console.error('err: ', err);
        reject(err);
      });

  });

};


mongoose.model('Location', LocationSchema);