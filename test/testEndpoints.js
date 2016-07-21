/*jslint node: true, maxcomplexity: 5 */
'use strict';

console.log('NOTE: Don\'t abuse with the test, or your credentials will be throttled!!!');

var assert = require('assert'),
	forAllAsync = require('forallasync').forAllAsync;

assert(process.env.MEETUP_KEY, 'MEETUP_KEY variable isn\'t set on enviroment (use \'set \"MEETUP_KEY=key\"\' on Windows)');

var meetup = require('../lib/meetup')();

// for (var i in meetup) { console.log(i) }

var endpoints = require('../lib/endpoints.json');

assert(meetup.version, 'Can\'t get Version');
try {
	meetup.version = '0.0.0';
} catch(err) {}
assert(meetup.version !== '0.0.0', 'Version not read only');

console.log('%s ver %s Test\n\n', meetup.description, meetup.version);

console.log('Get version\t\tPASS');

assert(!meetup.authkey, 'Authkey getter failed');
console.log('Authkey getter\t\tPASS');
meetup.authkey = process.env.MEETUP_KEY;
assert(meetup.authkey, 'Authkey setter failed');
console.log('Authkey setter\t\tPASS');

assert(meetup.dependencies.superagent, 'Superagent version not set');
try {
	meetup.dependencies.superagent = 0;
} catch (err) {}
assert(meetup.dependencies.superagent !== 0, 'Read Only properties can be writed');
console.log('Read Only properties\t\tPASS');

console.log('\nModule functions check:\n');

function objectType(obj) {
	switch (typeof obj) {
		case 'object':
			return (Array.isArray(obj)) ? 'array' : 'object';
		default:
			return typeof obj;
	}
}

var checkEndpoint = {};

checkEndpoint.http = function(endpointkey, cb) {
	if (endpoints[endpointkey].chunked) {
		var chnk = meetup[endpointkey](endpoints[endpointkey].test.params)
			.on('data', ret => {
				chnk.abort();
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
			})
			.on('end', function() {
				console.log('%s\t\tPASS', endpointkey);
				cb();
			});
	} else {
		meetup[endpointkey](endpoints[endpointkey].test.params, (err, ret) => {
			ret = ret || {};
			
			((errors) => {
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

					endpoints[endpointkey].test.return.keys.forEach(returnkey => {
						assert(ret.hasOwnProperty(returnkey), 'Method ' + endpointkey + ' don\'t return the "' + returnkey + '" key');
					});

					break;
				default:
			}

			assert(!err, err);

			console.log('%s\t\tPASS', endpointkey);
			cb();
		});
	}

};

checkEndpoint.ws = function(endpointkey, cb) {
	var ws = meetup[endpointkey](endpoints[endpointkey].params)
		.on('data', (ret) => {
			ws.removeAllListeners('data');
			ws.abort();
			switch (objectType(ret)) {
				case 'object':
					assert(endpoints[endpointkey].test.return.keys, endpointkey + ' hasn\'t defined keys on endpoints.json');

					endpoints[endpointkey].test.return.keys.forEach(function(returnkey) {
						assert(ret.hasOwnProperty(returnkey), endpointkey + ' not return the ' + returnkey + ' key');
					});

					break;
				default:
			}
		})
		.on('close', () => {
			console.log('%s\t\tPASS', endpointkey);
			cb();
		});
};

var meetup_commands = (process.argv[2]) ? process.argv[2].split(',') : meetup.commands;

forAllAsync(meetup_commands
	.filter(command => {
		return endpoints[command].hasOwnProperty('test') &&
			!endpoints[command].test.hasOwnProperty('disabled');
	}),
	(next, command) => {
		if (endpoints[command].resource.match(/^ws{1,2}\:/)) {
			checkEndpoint.ws(command, next);
		} else {
			setTimeout(() => {
				checkEndpoint.http(command, next);
			}, 1000);
		}
	},
	1
);

process.on('exit', function(code) {
	if (!code) {
		console.log('\nDone!');
	}
});