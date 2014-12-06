#!/usr/bin/env node

var assert = require('assert');

assert(process.env.meetup_key, 'meetup_key doesn\'t exist on enviroment');

var meetup = require('../lib/meetup')({key: process.env.meetup_key}),
	endpoints = require('../lib/endpoints.json');

console.log("%s ver %s Test\n\n", meetup.description, meetup.version);

function objectType(obj) {
	switch (typeof obj) {
		case 'object':
			return (Array.isArray(obj)) ? "array" : "object";
			break;
		default:
			return "unknown";
	}

}

Object.keys(endpoints).filter(function(endpointkey) {
	return endpoints[endpointkey].hasOwnProperty('test');
}).forEach(function(endpointkey) {
	meetup[endpointkey](endpoints[endpointkey].test.params, function(err, ret) {

		assert(!ret.problem, ret.code + '\n' + ret.details + '\n');
		assert(!ret.errors, JSON.stringify(ret.errors));

		assert.equal(objectType(ret), endpoints[endpointkey].test.return.type, endpointkey + ' not return an ' + endpoints[endpointkey].test.return.type);

		switch (objectType(ret)) {
			case 'object':
				assert(endpoints[endpointkey].test.return.keys, endpointkey + ' hasn\'t defined keys on endpoints.json');

				endpoints[endpointkey].test.return.keys.forEach(function(returnkey) {
					assert(ret.hasOwnProperty(returnkey), endpointkey + ' not return the ' + returnkey + ' key');
				});

				break;
			default:
		}

		console.log('%s\t\tPASS', endpointkey);
	});
});

process.on('exit', function(code) {
	if (!code) {
		console.log("\nDone!");
	}
});