var assert = require('assert');

assert(process.env.MEETUP_KEY, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set \'MEETUP_KEY=key\'\' on Windows)');

var meetup = require('../lib/meetup')({
    key: process.env.MEETUP_KEY
});

meetup.postGroupPhoto({
    group_urlname: 'NodeJS-Argentina',
    photo: 'meetup.jpg',
    await: true
}, function(error, response) {
    if (error) {
        console.log(error);
    } else {
        console.log('Upload response:', response);

        meetup.deletePhoto({
            id: response.group_photo_id
        }, function(error, response) {
            if (error) {
                console.log(error);
            } else {
            	console.log('Delete response:', response);
            }
        });
    }
});
