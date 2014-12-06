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
    util = require('util'),
    endpoints = require('./endpoints.json'),
    packageJSON = require('../package.json'),
    MeetupAPIkey;

/*
 * Constructor
 *
 * @param {key} Meetup API key
 * @return {Object} new instance
 */

function Meetup(params) {

    // Assign module parameters
    MeetupAPIkey = params.key;

    // Module metadata
    this.version = packageJSON.version;
    this.name = packageJSON.name;
    this.description = packageJSON.description;
    this.dependencies = packageJSON.dependencies;
    this.author = packageJSON.author;
    this.repository = packageJSON.repository;

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
 * Create Meetup prototypes
 */

var APIRequest = function(endpoint, params, callback) {

    // insert meetupAPIkey only if it exists.  Note: for oauth it requires 
    // that you passed the 'access_token' field instead of 'key' field.  
    if (MeetupAPIkey !== undefined) {
        params.key = MeetupAPIkey;
    }

    // supply url vars
    var url = endpoint.resource,
        urlVars = endpoint.resource.match(/\/:\w+/g) || [];

    urlVars.forEach(function(urlVar) {
        url = url.replace(urlVar, '/' + params[urlVar.substr(2)]);
        delete params[urlVar.substr(2)];
    });

    // generate request
    request(endpoint.method, url)
        .query(params)
        .set('Accept', '*/*')
        .set('User-Agent', 'Meetup API lib for Node.js (' + Meetup.version + ')')
        .buffer(true)
        .end(function(res) {
        
            if (!Object.keys(res.body).length) {
                callback(res.error, JSON.parse(res.text));
            } else {
                callback(res.error, res.body);
            }
        });
};

Object.keys(endpoints).forEach(function(key) {
    Meetup.prototype[key] = function(params, callback) {
        if ("function" === typeof params) {
            callback = params;
            params = {};
        }
        preProcess(params);
        APIRequest.call(this, endpoints[key], params, callback);
        return this;
    };
});

/*
 * Export new constructor wrapper
 */

module.exports = function(params) {

    return new Meetup(params);
};
