var _meetup = require('meetup-api')();

// _meetup.proxy = 'http://149.202.94.120:3128';

_meetup.findLocations({
	query: 'Córdoba'
}, function (err, results) {
    console.log(results);
});

_meetup.getCities({
	lat: -34.603722,
	lon: -58.381592,
	country: 'AR'
}, function (err, results) {
    console.log(results);
});