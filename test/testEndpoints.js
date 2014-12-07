#!/usr/bin/env node

var assert = require('assert');

assert(process.env.MEETUP_KEY, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set "MEETUP_KEY=key"\' on Windows)');

var meetup = require('../lib/meetup')({
		key: process.env.MEETUP_KEY
	}),
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

Object.keys(endpoints)
	.filter(function(endpointkey) {
		return endpoints[endpointkey].hasOwnProperty('test');
	})
	.forEach(function(endpointkey, index) {
		setTimeout(
			function() {
				meetup[endpointkey](endpoints[endpointkey].test.params, function(err, ret) {

					var errors = (function(errors) {
						ret.problem = errors || ret.problem;
						ret.code = errors && errors.code || ret.problem;
						ret.details = errors && errors.message || ret.details;

					})(
						ret && ret.errors && ret.errors.pop()
					);

					assert(!ret.problem, ret.code + ' (' + ret.details + ')\n');

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
			},
			1000 * index + 1
		);
	});

process.on('exit', function(code) {
	if (!code) {
		console.log("\nDone!");
	}
});