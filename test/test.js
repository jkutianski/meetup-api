#!/usr/bin/env node

var meetup = require('../lib/meetup')('');

meetup.events({'group_urlname' : 'NodeJS-Argentina'}, function(err_events,events) {
  console.log(events);
});