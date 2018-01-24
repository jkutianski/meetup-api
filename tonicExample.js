var _meetup = require('meetup-api')();
// var _proxy = require('proxy-agent'); // runkit workaround

// _meetup.proxy = 'http://54.255.251.162:8080'



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