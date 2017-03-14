var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

function getNearlyLocatedMembersMath (circle) {

  var locArr = _.map(circle.members, 'loc');
  var nearPoints = [];

  for (var i = 1; i < locArr.length; i++) {
    var member = locArr[i - 1];
    var searchArr = _.takeRight(locArr, locArr.length - i);

    _.each(searchArr, function(dot) {
      var distance = Math.pow(member[0] - dot[0], 2) + Math.pow(member[1] - dot[1], 2);
      if (distance < 0.00000026) {
        nearPoints.push(member, dot);
      }
    });
  }
  var pointsArr = _.uniq(nearPoints);

  var members = _.filter(circle.members, function(m) {
    return pointsArr.indexOf(m.loc) !== -1
  });

  return members;

}

var CircleSchema = new Schema({
  name: { type: String, default: 'circle' },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Location'
    }
  ]
});

CircleSchema.methods.getNearlyLocatedToMember = function (method, member, ids) {
  var self = this;
  var sphereRadius = 0.032/3963.2;

  return new Promise (function(resolve, reject) {

    var locQuery = {};

    if (method === 'near') {
      locQuery = {
        $near: member.loc,
        $maxDistance: 0.0005
      }
    } else {
      locQuery = {
        $geoWithin: {
          $centerSphere: [ member.loc, sphereRadius ]
        }
      }
    }

    self.model('Location').find({
        '_id': { $in: ids },
        loc: locQuery
      })
      .then(function(data) {

        if(data.length > 0) {
          data.push(member);
        }

        resolve(data);
      })
      .catch(function(err) {
        reject(err);
      })
  });
};

CircleSchema.methods.getNearlyLocatedMembersDBIndex = function (method) {
  var self = this;
  var members = self.members;
  var memberIds = _.map(members, '_id');
  var promiseArr = [];

  for (var i = 1; i < members.length; i++) {

    var member = members[i - 1];
    var slice = _.takeRight(memberIds, members.length - i);

    promiseArr.push(self.getNearlyLocatedToMember(method, member, slice))
  }

  return new Promise(function(resolve, reject) {
    Promise.all(promiseArr)
      .then(function(data) {
        resolve(data)
      })
      .catch(function(error) {
        reject(error);
      });
  });
};

CircleSchema.methods.getNearlyMembersEntireCircle = function () {
  var self = this;
  var members = self.members;
  var memberIds = _.map(members, '_id');
  var queryArr = [];
  var sphereRadius = 0.032/3963.2;

  _.each(members, function(member) {
    var idsSlice = _.reject(memberIds, member._id);

    queryArr.push({
      '_id': { $in: idsSlice },
      loc: {
        $geoWithin: {
          $centerSphere: [ member.loc, sphereRadius ]
        }
      }
    })

  });

  return new Promise(function(resolve, reject) {
    return self.model('Location').find({$or: queryArr}).then(function(data) {
      resolve(data);
    }).catch(function(err) {
      console.log('error on big query');
      reject(err)
    });

  });
};

CircleSchema.statics.createTestCircle = function (circleIndex) {
  var self = this;

  return new Promise(function (resolve, reject) {
    var locationArr = [];
    var austinCoords = [97.7431, 30.2672]; //location sample

    //approximate 1000 feet interval
    var long1000Feet = 0.00347;
    var lat1000Feet = 0.00275;

    for(var i = 1; i<=10; i++) {
      locationArr.push({
        name: 'location' + i + 'from' + circleIndex,
        loc: [(austinCoords[0] + Math.random()*long1000Feet).toFixed(6), (austinCoords[1] + Math.random()*lat1000Feet).toFixed(6)]
      })
    }

    return self.model('Location').insertMany(locationArr)
      .then(function(locationsData) {

        var memberIds = _.map(locationsData, function(d) {
          return mongoose.Types.ObjectId(d._id)
        });

        return self.create(
          {
            name: 'loc' + circleIndex,
            members: memberIds
          }
        );
      }).then(function(createLocData) {
        return resolve('ok');
      })
      .catch(function(error) {
        return reject(error);
      });
  });
};

CircleSchema.statics.getNearMath = function () {
  var self = this;
  console.time('math');

  return new Promise(function(resolve, reject) {
    return self.find({})
      .populate('members')
      .then(function(circles) {
        var totalPoints = 0;

        _.each(circles, function (circle) {
          var nearbyMembers = getNearlyLocatedMembersMath(circle);
          totalPoints += nearbyMembers.length;
        });

        console.timeEnd('math');

        return resolve({circles: circles.length, total_points: totalPoints})
      })
      .catch(function(error) {
        console.error(error);
        return reject(error);
      });
  });
};

CircleSchema.statics.getNearDBIndex = function (method) {
  var self = this;
  console.time(method);

  return new Promise(function(resolve, reject) {
    return self.find({})
      .populate('members')
      .then(function(circles) {
        var promiseArr = [];

        circles.forEach(function(circle) {
          promiseArr.push(circle.getNearlyLocatedMembersDBIndex(method));
        });

        Promise.all(promiseArr)
          .then(function(data) {
            console.timeEnd(method);
            var totalPoints = 0;

            _.each(data, function(d) {
              var uniquePointsCount = _.uniq(_.map(_.flatten(d), 'name')).length;
              totalPoints += uniquePointsCount;
            });

            return resolve({circles: circles.length, total_points: totalPoints})
          })
      })
      .catch(function(error) {
        console.error(error);

        return reject(error);
      });
  })
};

CircleSchema.statics.getNearEntireCircle = function () {
  var self = this;
  console.time('complex query');

  return new Promise(function(resolve, reject) {
    return self.find({})
      .populate('members')
      .then(function(circles) {
        var promiseArr = [];

        circles.forEach(function(circle) {
          promiseArr.push(circle.getNearlyMembersEntireCircle());
        });

        Promise.all(promiseArr)
          .then(function(data) {
            console.timeEnd('complex query');

            var uniquePoints = _.uniq(_.flatten(data)).length;

            return resolve({circles: circles.length, total_points: uniquePoints})
          })
      })
      .catch(function(error) {
        console.error(error);

        return reject(error);
      });
  })
};


mongoose.model('Circle', CircleSchema);