var meetup = require('../lib/meetup')(),
	count = 1;

var ws = meetup.getStreamPhotos()
	.on('data', function(obj) {
		if (count > 10) {
			ws.abort();
		}
		console.log('%s - %s by %s',
			count,
			obj.photo_link,
			obj.member.name
		);
		count++;
	}).on('close', function() {
		console.log('done!');
	});