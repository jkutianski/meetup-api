var assert = require('assert');

assert(process.env.MEETUP_KEY, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set \"MEETUP_KEY=key\"\' on Windows)');

var meetup = require('../lib/meetup')({
	key: process.env.MEETUP_KEY
});

meetup.getEvents({
	member_id: 'self'
}, function(error, events) {
	if (error) {
		console.log(error);
	} else {
		console.log(events);
	}
});