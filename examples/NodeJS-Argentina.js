var assert = require('assert');

assert(process.env.MEETUP_KEY, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set \"MEETUP_KEY=key\"\' on Windows)');

var meetup = require('../lib/meetup')({
	key: process.env.MEETUP_KEY
});

meetup.getGroup({
	urlname: 'NodeJS-Argentina'
}, function(err, obj) {
	if (err) {
		console.log(err);
	} else {
		console.log('%s <%s> (%s members)', obj.name, obj.link, obj.members);
	}
});