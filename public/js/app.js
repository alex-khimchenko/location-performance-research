$(function() {

    // create test data
    $('.create-test-circle').click(function() {
      $.post('/createTestCircle', function(data) {
        console.log('create test circle data: ', data);
      });
    });

    $('.populate-test-circles-10').click(function() {
      $.post('/populateTestCircles', {amount: 10, from: 0}, function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.populate-test-circles-25000').click(function() {
      $.post('/populateTestCircles', {amount: 25000, from: 0}, function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.populate-test-circles-50000').click(function() {
      $.post('/populateTestCircles', {amount: 25000, from: 25000}, function(data) {
        console.log('populate test circles: ', data);
      });
    });

    // find nearly located members
    $('.populate-near').click(function() {
      $.post('/getNearMath', function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.populate-near-db-index').click(function() {
      $.post('/getNearDBIndex', function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.populate-within-db-index').click(function() {
      $.post('/getGeoWithinDBIndex', function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.populate-near-entire-circle').click(function() {
      $.post('/getNearEntireCircle', function(data) {
        console.log('populate test circles: ', data);
      });
    });

    // Location change emulation
    $('.emulate-location-change').click(function() {
      $.post('/emulateLocationChange', function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.send-ping').click(function() {
      $.post('/sendPing', function(data) {
        console.log('populate test circles: ', data);
      });
    });

  }
);




