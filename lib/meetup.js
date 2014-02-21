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

var request = require('superagent')
  , util = require('util')
  , endpoints = require('./endpoints.json');

var MeetupAPIkey;

/*
 * Constructor
 *
 * @param {key} Meetup API key
 * @return {Object} new instance
 */ 

function Meetup(key) {
  MeetupAPIkey = key;
  return this;
};

/*
 * Version
 */
 
Meetup.version = '0.1.3';

/*
 * Create Meetup prototypes
 */
 
Object.keys(endpoints).forEach(function(key){
  Meetup.prototype[key] = function(params, callback){
    if("function" == typeof params){
      callback = params;
      params = {};
    }
    preProcess(params);
    APIRequest.call(this, endpoints[key], params, callback);
    return this;
  };
});

var APIRequest = function(endpoint, params, callback) {
  var self = this;
  // insert meetupAPIkey
  params.key = MeetupAPIkey;
  // supply url vars
  var url = endpoint.resource
    , url_vars = endpoint.resource.match(/\/:\w+/g) || [];
  url_vars.forEach(function(url_var){
    url = url.replace(url_var, '/' + params[url_var.substr(2)]); 
  });
  // generate request
  var req = request(endpoint.method, url)
            .query(params)
            .set('Accept', '*/*')
            .set('User-Agent', 'Meetup API lib for Node.js (' + Meetup.version + ')')
            .buffer(true)
            .end(function(res){
              if(!Object.keys(res.body).length) {
                callback(res.error, JSON.parse(res.text));
              } else {
                callback(res.error, res.body);
              }
            });
};

/*
 * Preprocess params
 */

var preProcess = function(obj) {
  for(var i in obj)
    if(util.isArray(obj[i])) obj[i] = obj[i].join(',');
};

/*
 * Export new constructor wrapper
 */
 
module.exports = function(key){
  return new Meetup(key);
};

