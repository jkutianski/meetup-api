var assert = require('assert');

assert(process.env.MEETUP_KEY, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set \"MEETUP_KEY=key\"\' on Windows)');

var meetup = require('../lib/meetup')({
		key: process.env.MEETUP_KEY
	});

var	count = 1;

var ovs = meetup.getStreamOpenEvents({
	since_mtime: 1294435118533
}).on('data', function(obj) {
	if (count <= 10) {
		console.log('%s - %s (%s) at %s (%s)',
			count,
			obj.name,
			obj.group.name,
			obj.group.city,
			obj.group.country.toUpperCase()
		);

	} else {
		ovs.abort();
	}
	count++;
}).on('end', function () {
	console.log('Done!');
});