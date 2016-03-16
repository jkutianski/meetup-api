var assert = require('assert');

var meetup = require('../lib/meetup')();

meetup.getCities({
	lat: -34.603722,
	lon: -58.381592,
	country: "AR"
}, function(err, resp) {
    if (err) {
        console.error('Found meetup error', err);
    }
    console.log(resp)
});