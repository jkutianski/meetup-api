#!/usr/bin/env node

var meetup = require('../lib/meetup')('');

meetup.getEvents({'group_urlname' : 'NodeJS-Argentina'}, function(err,events) {
  console.log(events);
});


