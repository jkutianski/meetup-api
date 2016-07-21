var assert = require('assert'),
    http = require('http'),
    url = require('url'),
    oauth_token;

assert(process.env.MEETUP_OAUTH, 'MEETUP_OAUTH variable isn\'t set on enviroment (use \'set \"MEETUP_OAUTH={\'key\': \'your_token\', \'secret\': \'your_secret\'}\"\' on Windows)');

var meetup = require('../lib/meetup')({
    oauth: JSON.parse(process.env.MEETUP_OAUTH)
});

// you can pass the key using
// meetup.authkey = {key: 'keyvalue', secret: 'secretvalue'};
// if the authkey is set `meetup.authkey === true`

// Create an HTTP server
var server = http.createServer(function(request, response) {
    var uri = url.parse(request.url, true);

    oauth_token = oauth_token || uri.query.access_token || uri.query.code;
    if (oauth_token) {
        meetup.getOAuth2AccessToken(oauth_token, function(error) {
        	if (error) {
                console.warn(error);
            }
            // meetup.refreshOAuth2AccessToken(null, function(error) {
            	if (error) {
                    console.warn(error);
                }
                meetup.getGroup({
                    'urlname': 'NodeJS-Argentina'
                }, function(err, obj) {
                    if (err) {
                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        response.end(JSON.stringify(err));
                    } else {
                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        response.end(JSON.stringify(obj));
                    }
                });
            // });
        });
    } else {
        meetup.getOAuth2RequestToken({
            redirect: 'http://localhost:8000/'
        }, function(error, Url) {
            if (!error) {
                response.writeHead(302, {
                    Location: Url
                });
                response.end();
            } else {
                response.writeHead(500, {
                        'Content-Type': 'application/json'
                });
                response.end(JSON.stringify(error));
            }
        });
    }
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:8000/');
