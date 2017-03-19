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

    // clear all locations and circles
    $('.clear-db').click(function() {
      $.post('/clear', function(data) {
        console.log('clear data: ', data);
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

    //visualisation
    $('.visualize').click(function() {
      $.post('/visualize', function(data) {
        console.log('visualise data: ', data);
        populate_map(data.points);
      });
    });


    function populate_map(pos_data) {
      $(".svg-content").html('');
      console.log('count: ', pos_data.length);

      var width = 540;
      var height = 540;

      var svg = d3.select( ".svg-content" )
        .append( "svg" )
        .attr( "width", width )
        .attr( "height", height );

      var elem = svg.selectAll("g")
        .data(pos_data);

      var elemEnter = elem.enter()
        .append("g")
        .attr("class", "node-group")
        .attr("transform", function(d) {
          return "translate(" + (d.loc[0] + 20) + "," + (d.loc[1] + 20) + ")"
        });


      var circle = elemEnter.append("circle")
        .attr("r", 20 )
        .attr("stroke","orange")
        .attr("opacity", "0.4")
        .attr("fill", function(d) {return d.name});

      var circle = elemEnter.append("circle")
        .attr("r", 3 )
        .attr("fill", "green");

      elemEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(function(d, i) { return i + 1; });


    }

  }
);




