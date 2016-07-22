var meetup = require('../lib/meetup')(),
	count = 1;

meetup.proxy = 'http://localhost:3128';

console.log('Use proxy:', meetup.proxy);

var ovs = meetup.getStreamRSVPs()
	.on('data', function(obj) {
		if (count > 10) {
			ovs.abort();
		}
		if (obj.response === 'yes') {
			console.log('%s - %s (%s) at %s (%s)',
				count,
				obj.event.event_name,
				obj.group.group_name,
				obj.group.group_city,
				obj.group.group_country.toUpperCase()
			);
			count++;
		}
	});