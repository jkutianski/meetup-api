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
    websocket = require('websocket-stream'),
    URL = require('url'),
    util = require('util'),
    extend = require('node.extend'),
    createProperties = require('./createObjProperties.js'),
    endpoints = require('./endpoints.json'),
    packageJSON = require('../package.json');

// create OAuth object && hook superagent-oauth
try {
    var OAuth = new require('oauth').OAuth;
    require('superagent-oauth')(request);
} catch (err) {
    OAuth = null;
}

/*
 *  Variables
 */

var MeetupAPIkey,
    APIRequest = {};

/*
 * Constructor
 *
 * @params
 *      {key} Meetup API key
 *      {oath}{key, secret} Meetup API oauth object
 * @return {Object} new instance
 */

function Meetup(params) {

    // Assign Meetup auth data
    MeetupAPIkey = params && (params.key || params.oauth || null);

    // Assign oauth dependencies & parameters
    if (OAuth && params && params.oauth) {
        Meetup.oauth = new OAuth(
            'https://api.meetup.com/oauth/request/',
            'https://api.meetup.com/oauth/access/',
            params.oauth.key,
            params.oauth.secret,
            '1.0',
            null,
            'HMAC-SHA1'
        );
    }

    return this;
}

/*
 * Preprocess params
 */

var preProcess = function(obj) {
    for (var i in obj) {
        if (util.isArray(obj[i])) {
            obj[i] = obj[i].join(',');
        }
    }
};

/*
 * Add metedata list
 */

// create metadata properties
createProperties(packageJSON, [{
    key: 'version',
    writable: false
}, {
    key: 'name',
    writable: false
}, {
    key: 'description',
    writable: false
}, {
    key: 'dependencies',
    writable: false
}, {
    key: 'optionalDependencies',
    writable: false
}, {
    key: 'repository',
    writable: false
}, {
    key: 'authkey',
    enumerable: true,
    configurable: true,
    get: function() {
        return (MeetupAPIkey) ? true : false;
    },
    set: function(auth) {
        MeetupAPIkey = auth;
    }
}], Meetup.prototype);

// Create commands list array
Meetup.prototype.commands = Object.keys(endpoints);

/*
 * Create functions
 */

// HTTP(S) request
APIRequest.http = function(endpoint, params, callback) {

    // insert meetupAPIkey only if it exists.  Note: for oauth it requires 
    // that you passed the 'access_token' field instead of 'key' field.  
    if (MeetupAPIkey && (typeof MeetupAPIkey === 'string')) {
        params.key = MeetupAPIkey;
    }

    // supply url vars
    var url = URL.parse(endpoint.resource, true),
        urlVars = url.pathname.match(/\/:\w+/g) || [];

    // disable url.search to force URL.format to use url.query
    url.search = null;

    // replace url variables with parameters data and delete the populated properties from params 
    urlVars.forEach(function(urlVar) {
        url.pathname = url.pathname.replace(urlVar, '/' + params[urlVar.substr(2)]);
        delete params[urlVar.substr(2)];
    });

    // generate request
    var req = request(endpoint.method, URL.format(url));

    // request parameters
    this.oauth = this.oauth || {};

    if (Meetup.oauth && (typeof MeetupAPIkey === 'object')) {
        //add oauth keys
        req.sign(
            Meetup.oauth,
            params.access_token_key || MeetupAPIkey.access_token,
            params.access_token_secret || MeetupAPIkey.access_token_secret
        );
    }

    req.query(params)
        .set('Accept', '*/*')
        .set('User-Agent', 'Meetup API lib for Node.js (' + Meetup.version + ')')
        .buffer(true);

    // request funtions
    this.abort = function() {
        req.abort();
        return this;
    };

    this.timeout = function(ms) {
        ms = (params.callback) ? 0 : ms;
        req.timeout(ms);
        return this;
    };

    // execute the request
    req.end(function(res) {
        if (!Object.keys(res.body).length) {
            callback(res.error, JSON.parse(res.text));
        } else {
            callback(res.error, res.body);
        }
    });

    // pass call back to request events
    this.on = function(event, callback) {
        req.on(event, callback);
        return this;
    };
};

// WebSocket request
APIRequest.ws = function(endpoint, params, callback) {
    // supply url vars
    var url = URL.parse(endpoint.resource, true);

    // add query to url
    url.query = extend(url.query, params);

    // disable url.search to force URL.format to use url.query
    url.search = null;

    // create websocket connection
    var ws = websocket(URL.format(url));

    // abort websocket stream
    this.abort = function() {
        ws.destroy();
        return this;
    };

    // pass websocket events
    this.on = function(event, callback) {
        switch (event) {
            case 'data':
                ws.on(event, function(data) {
                    // parse buffer string to JSON and eturn to the callback
                    callback(JSON.parse(data.toString()));
                });
                break;
            default:
                // pass call back to websocket event
                ws.on(event, callback);
        }
        return this;
    };

};

/*
 * Create Meetup prototypes
 */

Meetup.prototype.commands
    .forEach(function(key) {
        Meetup.prototype[key] = function(params, callback) {
            // parse endpoint url and get the protocol (without ':')
            var url = URL.parse(endpoints[key].resource),
                protocol = url.protocol.replace(':', '');

            // replace 'https' with 'http' to use the same request function
            protocol = (protocol === 'https') ? 'http' : protocol;

            // assign param function to callback
            if ("function" === typeof params) {
                callback = params;
                params = {};
            }

            preProcess(params);
            APIRequest[protocol].call(this, endpoints[key], params, callback);

            // return Meetup object
            return this;
        };
    });

Meetup.prototype.getOAuthRequestToken = function(callback) {
    return Meetup.oauth.getOAuthRequestToken({},
        function(error, oauth_token, oauth_token_secret, results) {
            MeetupAPIkey.oauth_token = oauth_token;
            MeetupAPIkey.oauth_token_secret = oauth_token_secret;
            callback(error, 'http://www.meetup.com/authorize/?oauth_token=' + oauth_token);
        }
    );
};

Meetup.prototype.getOAuthAccessToken = function(oauth_verifier, callback) {
    return Meetup.oauth.getOAuthAccessToken(MeetupAPIkey.oauth_token, MeetupAPIkey.oauth_token_secret, oauth_verifier,
        function(error, access_token, access_token_secret, results) {
            MeetupAPIkey.access_token = access_token;
            MeetupAPIkey.access_token_secret = access_token_secret;
            callback();
        }
    );
};

/*
 * Export new constructor wrapper
 */

module.exports = function(params) {

    // return new Meetup object on require
    return new Meetup(params);

};