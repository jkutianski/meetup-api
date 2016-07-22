var meetup = require('../lib/meetup')();

// meetup.proxy = 'http://localhost:3128';

console.log('Use proxy:', meetup.proxy); // ISSUE: on HTTP(S) GET/POST/PUT/DELETE returns 404

meetup.getCities({
	lat: -34.603722,
	lon: -58.381592,
	country: 'AR'
}, function(err, resp) {
    if (err) {
        // console.error(err);
    }
    console.log(resp);
});