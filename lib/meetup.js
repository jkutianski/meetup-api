/*
    Meetup.js - Node JS Meetup API library

    This library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Module dependencies
 */

var request = require('superagent'),
    URL = require('url'),
    util = require('util'),
    extend = require('node.extend'),
    endpoints = require('./endpoints.json'),
    packageJSON = require('../package.json');

/*
 *  Variables
 */

var MeetupAPIkey,
    APIRequest = {};

/*
 * Constructor
 *
 * @param {key} Meetup API key
 * @return {Object} new instance
 */

function Meetup(params) {

    // Assign module parameters
    MeetupAPIkey = (params && params.key) ? params.key : null;

    return this;
};

/*
 * Preprocess params
 */

var preProcess = function(obj) {
    for (var i in obj) {
        if (util.isArray(obj[i])) {
            obj[i] = obj[i].join(',');
        };
    }
};

/*
 * Add metedata list
 */

// create metadata objects
var metadataKeys = [
    'version',
    'name',
    'description',
    'dependencies',
    'repository'
];
    
metadataKeys.forEach(function (key) {
    Meetup.prototype[key] = packageJSON[key];
});

// Create commands list array
Meetup.prototype.commands = Object.keys(endpoints);

/*
 * Create functions
 */

APIRequest.http = function(endpoint, params, callback) {

    // insert meetupAPIkey only if it exists.  Note: for oauth it requires 
    // that you passed the 'access_token' field instead of 'key' field.  
    if (MeetupAPIkey) {
        params.key = MeetupAPIkey;
    }

    // supply url vars

    var url = URL.parse(endpoint.resource, true),
        urlVars = url.pathname.match(/\/:\w+/g) || [];

        url.search = null;

    urlVars.forEach(function(urlVar) {
        url.pathname = url.pathname.replace(urlVar, '/' + params[urlVar.substr(2)]);
        delete params[urlVar.substr(2)];
    });

    // generate request
    var req = request(endpoint.method, URL.format(url))
        .query(params)
        .set('Accept', '*/*')
        .set('User-Agent', 'Meetup API lib for Node.js (' + Meetup.version + ')')
        .buffer(true);

    this.abort = function() {
        req.abort();
        return this;
    };

    this.timeout = function(ms) {
        ms = (params.callback) ? 0 : ms;
        req.timeout(ms);
        return this;
    };

    req.end(function(res) {
        if (!Object.keys(res.body).length) {
            callback(res.error, JSON.parse(res.text));
        } else {
            callback(res.error, res.body);
        }
    });

    this.on = function(event, callback) {
        req.on(event, callback);
        return this;
    };
};

APIRequest.https = APIRequest.http;

APIRequest.ws = function(endpoint, params, callback) {
    var websocket = require('websocket-stream'),    
        url = URL.parse(endpoint.resource, true);

        url.query = extend(url.query, params);
        url.search = null;

    var ws = websocket(URL.format(url));

    this.on = function(event, callback) {
        switch (event) {
            case 'data':
                ws.on(event, function (data) {
                    callback(JSON.parse(data.toString()));
                });
                break;
            default:
                ws.on(event, callback);
        }
        return this;
    };

    this.abort = function() {
        ws.destroy();
        return this;
    };

};

/*
 * Create Meetup prototypes
 */

Meetup.prototype.commands
    .forEach(function(key) {
        Meetup.prototype[key] = function(params, callback) {
            var url = URL.parse(endpoints[key].resource),
                type = url.protocol.replace(':', '');

            if ("function" === typeof params) {
                callback = params;
                params = {};
            }

            preProcess(params);
            APIRequest[type].call(this, endpoints[key], params, callback);
            return this;
        };
    });

/*
 * Export new constructor wrapper
 */

module.exports = function(params) {

   return new Meetup(params);

};