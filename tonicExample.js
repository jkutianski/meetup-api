var _meetup = require('meetup-api')();

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