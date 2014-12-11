var assert = require('assert'),
	key = process.env.MEETUP_KEY;

assert(key, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set "MEETUP_KEY=key"\' on Windows)');

var meetup = require('../lib/meetup')({
	key: key
});

meetup.getGroup({
	"urlname": "NodeJS-Argentina"
}, function(err, obj) {
	console.log("%s <%s> (%s members)", obj.name, obj.link, obj.members);
});