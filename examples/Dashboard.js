var assert = require('assert'),
	key = process.env.MEETUP_KEY;

assert(key, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set \"MEETUP_KEY=key\"\' on Windows)');

var meetup = require('../lib/meetup')({
	key: key
});

meetup.dashboard({}, function(err, obj) {
	console.log('nearby events: %s, upcoming events: %s', obj.stats.nearby_events, obj.stats.upcoming_events);
});