/*jslint node: true, maxcomplexity: 7 */
'use strict';
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

const
    request = require('superagent'),
    websocket = require('websocket-stream'),
    JSONStream = require('JSONStream'),
    evStream = require('event-stream'),
    URLfn = require('url'),
    endpoints = require('./endpoints.json'),
    packageJSON = require('../package.json'),
    requireOpt = require('./myUtils').requireOpt;

/*
 * Optional module dependencies
 */
const ProxyAgent = requireOpt('proxy-agent')['proxy-agent'],
    OAuth = requireOpt(['oauth', 'superagent-oauth'], (modules) => {
        return modules &&
            modules['superagent-oauth'] &&
            (modules['superagent-oauth'](request) || true) &&
            modules.oauth || null;
    });

/*
 *  Module private variables
 */

let MeetupAPIkey,
    ProxyURI;

/*
 * Constructor
 *
 * @params
 *      {key} Meetup API key
 *      {oath}{key, secret} Meetup API oauth object
 * @return {Object} new instance
 */

class Meetup {

    // Meetup contructor
    constructor(params) {

        // Assign Meetup auth data
        MeetupAPIkey = params && (params.key || params.oauth || null);
        Meetup.oauth = null;
        Meetup.oauth2 = null;

    }

    // create metadata properties
    get commands() {
        return Object.freeze(Object.keys(Meetup.prototype)); // delete this
    }
    get version() {
        return Object.freeze(packageJSON.version);
    }
    get name() {
        return Object.freeze(packageJSON.name);
    }
    get description() {
        return Object.freeze(packageJSON.description);
    }
    get dependencies() {
        return Object.freeze(packageJSON.dependencies);
    }
    get optionalDependencies() {
        return Object.freeze(packageJSON.optionalDependencies);
    }
    get repository() {
        return Object.freeze(packageJSON.repository);
    }
    get authkey() {
        return !!MeetupAPIkey;
    }
    set authkey(auth) {
        MeetupAPIkey = auth || null;
    }
    get proxy() {
        return !!(ProxyAgent && ProxyURI);
    }
    set proxy(uri) {
        ProxyURI = (ProxyAgent && uri) ? uri : null;
    }

    [Symbol.iterator]() {
        let index = -1,
            commands = Object.keys(Meetup.prototype);
        return {
            next: () => ({
                value: commands[++index],
                done: index === commands.length
            })
        };
    }

    // OAUTH functions
    getOAuthRequestToken(callback) {
        let errMessage = (MeetupAPIkey && MeetupAPIkey.key && MeetupAPIkey.secret) ? null : 'No OAuth Keys';
        errMessage = (OAuth) ? errMessage : 'No OAuth support';

        if (errMessage) {
            callback({
                message: errMessage
            }, null);
        } else {
            Meetup.oauth = new OAuth.OAuth(
                'https://api.meetup.com/oauth/request/',
                'https://api.meetup.com/oauth/access/',
                MeetupAPIkey.key,
                MeetupAPIkey.secret,
                '1.0',
                null,
                'HMAC-SHA1'
            );

            return Meetup.oauth.getOAuthRequestToken({}, (error, oauth_token, oauth_token_secret) => {
                let authorizeURL = null;
                if (!error) {
                    MeetupAPIkey.oauth_token = oauth_token;
                    MeetupAPIkey.oauth_token_secret = oauth_token_secret;
                    authorizeURL = 'http://www.meetup.com/authorize/?oauth_token=' + oauth_token;
                }
                callback(error, authorizeURL);
            });
        }
    }

    getOAuthAccessToken(oauth_verifier, callback) {
        return Meetup.oauth.getOAuthAccessToken(
            MeetupAPIkey.oauth_token,
            MeetupAPIkey.oauth_token_secret,
            oauth_verifier, (error, access_token, access_token_secret) => {
                if (error) {
                    callback(error);
                } else {
                    MeetupAPIkey.access_token = access_token;
                    MeetupAPIkey.access_token_secret = access_token_secret;
                    callback(null);
                }
            }
        );
    }

    getOAuth2RequestToken(params, callback) {

        let errMessage = (OAuth) ?
            (MeetupAPIkey && MeetupAPIkey.key && MeetupAPIkey.secret) ? null : 'No OAuth Keys' :
            'No OAuth support';

        if (errMessage) {
            callback({
                message: errMessage
            }, null);
        } else {

            Meetup.oauth2 = new OAuth.OAuth2(
                MeetupAPIkey.key,
                MeetupAPIkey.secret,
                'https://secure.meetup.com/',
                'oauth2/authorize',
                'oauth2/access',
                null
            );

            MeetupAPIkey.redirect = params.redirect;

            let authURL = Meetup.oauth2.getAuthorizeUrl({
                response_type: params.response_type || 'code',
                redirect_uri: params.redirect
            });

            if (authURL) {
                callback(null, authURL);
            } else {
                callback({
                    message: 'No authURL return'
                }, null);
            }
        }

    }

    getOAuth2AccessToken(oauth_verifier, callback) {

        if (typeof oauth_verifier === 'function') {
            callback = oauth_verifier;
            oauth_verifier = null;
        }

        var oauth2Params = (MeetupAPIkey.access_token && MeetupAPIkey.refresh_token) ? { grant_type: 'refresh_token' } : { grant_type: 'authorization_code', redirect_uri: MeetupAPIkey.redirect };

        Meetup.oauth2.getOAuthAccessToken(
            oauth_verifier || MeetupAPIkey.refresh_token,
            oauth2Params,
            (error, access_token, refresh_token) => {
                if (error) {
                    callback(error);
                } else {
                    MeetupAPIkey.access_token = access_token;
                    MeetupAPIkey.refresh_token = refresh_token;
                    callback(null);
                }
            }
        );
    }

    refreshOAuth2AccessToken(refresh_token, callback) {
        console.warn('WARNING: refreshOAuth2AccessToken() is deprecated use getOAuth2AccessToken() instead!');
        if (MeetupAPIkey.refresh_token) {
            this.getOAuth2AccessToken(refresh_token, callback);
        }
    }
}

/*
 * Request functions
 */

class APIRequest {

    // Preprocess params (used by 'Create Meetup prototypes')
    static preProcess(obj) {
        for (let i in obj) {
            if (obj[i].constructor.name.toLowerCase() === 'array') {
                obj[i] = obj[i].join(',');
            }
        }
    }

    // Create request object (used by 'HTTP(S) request')
    static create(method, url, params) {
        // insert meetupAPIkey only if it exists  
        params.key = (MeetupAPIkey && (typeof MeetupAPIkey === 'string')) && MeetupAPIkey;

        // supply url vars
        let thisUrl = URLfn.parse(url, true),
            urlVars = thisUrl.pathname.match(/\/:\w+/g) || [];

        // disable url.search to force URL.format to use url.query
        thisUrl.search = null;

        // replace url variables with parameters data and delete the populated properties from params 
        urlVars.forEach(
            urlVar => {
                thisUrl.pathname = thisUrl.pathname.replace(urlVar, '/' + params[urlVar.substr(2)]);
                delete params[urlVar.substr(2)];
            }
        );

        let req = request(method, URLfn.format(thisUrl))
            .set('User-Agent', packageJSON.name + '/NodejsClientLib/' + packageJSON.version);

        let agent = APIRequest.createProxyAgent(thisUrl);

        req._agent = agent;

        // return request object
        return req;
    }

    // Stream event
    static stream(req, callback) {
        // create stream
        req.pipe(JSONStream.parse()).pipe(
            // return data on event
            evStream.map(data => callback(data))
        );
    }

    // Add Oauth params (used by 'HTTP(S) request')
    static addOauthParams(req, params) {

        if (typeof MeetupAPIkey === 'object') {

            if (Meetup.oauth) {
                //add oauth keys
                req.sign(
                    Meetup.oauth,
                    params && params.access_token_key || MeetupAPIkey.access_token,
                    params && params.access_token_secret || MeetupAPIkey.access_token_secret
                );
            }

            if (Meetup.oauth2) {
                //add oauth2 bearer
                let bearer = params && params.access_token_key || MeetupAPIkey.access_token;
                req.set('Authorization', 'Bearer ' + bearer);
            }

        }

    }

    // create proxy agent object
    static createProxyAgent(url) {

        let agent = null;

        if (ProxyAgent && ProxyURI) {
            // create an instance of the `ProxyAgent` class with the proxy server information 
            let opts = URLfn.parse(ProxyURI);

            // IMPORTANT! Set the `secureEndpoint` option to `false` when connecting 
            //            over "ws://", but `true` when connecting over "wss://" 
            opts.secureEndpoint = (url.protocol) ? (url.protocol === 'wss:' || url.protocol === 'https:') : false;

            agent = new ProxyAgent(opts);
        }

        return agent;

    }

    // HTTP(S) request
    static http(endpoint, params, callback) {
        // preprocess parameters
        APIRequest.preProcess(params);

        // create request
        let req = APIRequest.create(endpoint.method, endpoint.resource, params);

        // add OAUTH parameters for request
        APIRequest.addOauthParams.call(this, req, params);

        // add MultiPart photo upload
        if (params.photo && endpoint.multipart_photo) {
            req.attach('photo', params.photo);
            delete params.photo;
        }

        // add query params &
        req.query(params)
            .set('Accept', '*/*')
            .set('User-Agent', packageJSON.name + '/NodejsClientLib/' + packageJSON.version)
            .buffer(true);

        // execute the request
        if (!endpoint.chunked) {
            req.end(
                (err, res) => {
                    let response = null;

                    if (!err) {

                        try {
                            response = (!Object.keys(res.body).length) ? JSON.parse(res.text) : res.body;
                        } catch (error) {
                            response = null;
                            err = error;
                            err.response = res;
                        }

                        if (res.header['x-ratelimit-limit']) {
                            response = response || {};
                            response.ratelimit = {
                                limit: res.header['x-ratelimit-limit'],
                                remaining: res.header['x-ratelimit-remaining'],
                                reset: res.header['x-ratelimit-reset']
                            };
                        }
                    }

                    callback(err || res.error, response);
                }
            );
        }

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

        // pass callback to request events & create stream on chunked HTTP endpoints
        this.on = function(event, callback) {
            if (endpoint.chunked && event === 'data') {
                APIRequest.stream(req, callback);
            } else {
                req.on(event, callback);
            }
            return this;
        };

        // listeners functions
        ['removeListener', 'removeAllListeners', 'setMaxListeners'].forEach(fnct => {
            this[fnct] = req[fnct];
            return this;
        });
    }

    // WebSocket request
    static ws(endpoint, params) {
        // preprocess parameters
        APIRequest.preProcess(params);

        // supply url vars
        let url = URLfn.parse(endpoint.resource, true);

        // add query to url
        url.query = Object.assign(url.query, params);

        // disable url.search to force URL.format to use url.query
        url.search = null;

        url = URLfn.format(url);


        // define websocket options
        let wsoptions = {},
            agent = APIRequest.createProxyAgent(url);

        wsoptions.agent = agent;

        // create websocket connection
        let ws = websocket(url, wsoptions);

        // abort websocket stream
        this.abort = function() {
            ws.destroy();
            return this;
        };

        // pass websocket events
        this.on = function(event, callback) {
            if (event === 'data') {
                ws.on(event, data => {
                    // parse buffer string to JSON and return to the callback
                    callback(JSON.parse(data.toString()));
                });
            } else {
                // pass call back to websocket event
                ws.on(event, callback);
            }
            return this;
        };

        // listeners functions
        let listeners = [
            'removeListener',
            'removeAllListeners',
            'setMaxListeners'
        ];
        listeners.forEach(fnct => {
            this[fnct] = ws[fnct];
            return this;
        });
    }
}

/*
 * Create Meetup prototypes
 */

Object.keys(endpoints).forEach(
    key => {
        Meetup.prototype[key] = function(params, callback) {

            if (!endpoints[key].disable) {
                // parse endpoint url and get the protocol (without ':')
                let url = URLfn.parse(endpoints[key].resource),
                    reqprotocol = url.protocol.replace(':', '');

                // replace 'https' with 'http' to use the same request function
                reqprotocol = (reqprotocol === 'https') ? 'http' : reqprotocol;

                // replace 'wss' with 'ws' to use the same request function
                reqprotocol = (reqprotocol === 'wss') ? 'ws' : reqprotocol;

                // assign param function to callback
                if ('function' === typeof params) {
                    callback = params;
                    params = {};
                }

                APIRequest[reqprotocol].call(this, endpoints[key], params, callback);

            } else if (endpoints[key].comments) {

                callback(endpoints[key].comments, null);

            }

            // return Meetup object
            return this;
        };
    }
);

/*
 * Export new constructor wrapper
 */

module.exports = function(params) {

    // return new Meetup object on require
    return new Meetup(params);

};
