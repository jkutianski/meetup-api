var meetup = require('../lib/meetup')();

meetup.proxy = 'http://54.255.251.162:8080';

console.log('Use proxy:', meetup.proxy);

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