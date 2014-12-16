var assert = require('assert'),
	http = require('http'),
	url = require('url'),
	RequestTokenUrl = '';

assert(process.env.MEETUP_OAUTH, 'MEETUP_OAUTH variable isn\'t set on enviroment (use \'set "MEETUP_OAUTH={"key": "your_token", "secret": "your_secret"}"\' on Windows)');

var meetup = require('../lib/meetup')({
	oauth: JSON.parse(process.env.MEETUP_OAUTH)
});

meetup.getOAuthRequestToken(function(error, Url) {
	RequestTokenUrl = Url;
});

// Create an HTTP server
var server = http.createServer(function(request, response) {
	var uri = url.parse(request.url, true);
	if (uri.query.oauth_token) {
		meetup.getOAuthAccessToken(uri.query.oauth_token, function() {
			meetup.getGroup({
				"urlname": "NodeJS-Argentina"
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
	} else {
		response.writeHead(302, {
		  'Location': RequestTokenUrl
		});
		response.end();
	}
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");