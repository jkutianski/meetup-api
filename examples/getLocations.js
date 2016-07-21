var assert = require('assert'),
	key = process.env.MEETUP_KEY;

assert(key, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set \'MEETUP_KEY=key\'\' on Windows)');

var meetup = require('../lib/meetup')({
	key: key
});

meetup.getLocations({'query': 'córdoba'}, function(err, arr) {
	arr.forEach(function(loc) {
		console.log('Found', loc.name_string);
	});	
});