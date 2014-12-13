var assert = require('assert');

assert(process.env.MEETUP_OAUTH, 'MEETUP_OAUTH variable isn\'t set on enviroment (use \'set "MEETUP_OAUTH={"key": "your_token", "secret": "your_secret"}"\' on Windows)');

var meetup = require('../lib/meetup')({
	key: JSON.parse(process.env.MEETUP_OAUTH)
});

meetup.getGroup({
	"urlname": "NodeJS-Argentina"
}, function(err, obj) {
	if (err) {
		console.log(err);
	} else {
		console.log("%s <%s> (%s members)", obj.name, obj.link, obj.members);
	}
});