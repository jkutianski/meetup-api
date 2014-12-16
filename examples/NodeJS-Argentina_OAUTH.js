var assert = require('assert'),
	http = require('http'),
	url = require('url');

assert(process.env.MEETUP_OAUTH, 'MEETUP_OAUTH variable isn\'t set on enviroment (use \'set "MEETUP_OAUTH={"key": "your_token", "secret": "your_secret"}"\' on Windows)');

var meetup = require('../lib/meetup')({
	oauth: JSON.parse(process.env.MEETUP_OAUTH)
});

meetup.getOAuthRequestToken(function(error, url) {
	console.log(url);
});

// Create an HTTP server
var server = http.createServer(function(request, response) {
	var uri = url.parse(request.url, true);
	if (uri.query.oauth_token) {
		meetup.getOAuthAccessToken(uri.query.oauth_token, function() {
			meetup.getGroup({
				"urlname": "NodeJS-Argentina",
				"access_token_key": uri.query.oauth_token
			}, function(err, obj) {
				if (err) {
					response.writeHead(200, {
						"Content-Type": "application/javascript"
					});
					response.end(JSON.stringify(err));
				} else {
					response.writeHead(200, {
						"Content-Type": "application/javascript"
					});
					response.end(JSON.stringify(obj));
				}
			});

		});
	}
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");