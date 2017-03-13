$(function() {

    $('.create-test-circle').click(function() {
      $.post('/createTestCircle', function(data) {
        console.log('create test circle data: ', data);
      });
    });

    $('.populate-test-circles-10').click(function() {
      $.post('/populateTestCircles', {amount: 10, from: 1}, function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.populate-test-circles-25000').click(function() {
      $.post('/populateTestCircles', {amount: 25000, from: 1}, function(data) {
        console.log('populate test circles: ', data);
      });
    });

    $('.populate-test-circles-50000').click(function() {
      $.post('/populateTestCircles', {amount: 25000, from: 25001}, function(data) {
        console.log('populate test circles: ', data);
      });
    });

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
  }
);




