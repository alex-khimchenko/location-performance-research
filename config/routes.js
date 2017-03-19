'use strict';

/**
 * Module dependencies.
 */

const home = require('../app/controllers/home');

/**
 * Expose
 */

module.exports = function (app, passport) {

  app.get('/', home.index);

  app.post('/createTestCircle', home.createTestCircle);

  app.post('/populateTestCircles', home.populateTestCircles);

  app.post('/clear', home.clearDB);

  app.post('/getNearMath', home.getNearMath);

  app.post('/getNearDBIndex', home.getNearDBIndex);

  app.post('/getGeoWithinDBIndex', home.getGeoWithinDBIndex);

  app.post('/getNearEntireCircle', home.getNearEntireCircle);

  app.post('/emulateLocationChange', home.emulateLocationChange);

  app.post('/changeLocation', home.changeLocation);

  app.post('/sendPing', home.sendPing);

  app.post('/ping', home.ping);

  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).render('404', {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
};
