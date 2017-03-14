'use strict';

const mongoose = require('mongoose');
const Location = mongoose.model('Location');
const Circle = mongoose.model('Circle');

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
      populateFunctions.push((Circle.createTestCircle(i + start)))
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
  }
};

module.exports = homeController;
