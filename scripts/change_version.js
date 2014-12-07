var fs = require('fs'),
	package = (function() {
		var package = {},
			json = require(process.cwd() + '/package.json');

		Object.defineProperty(package, 'json', {
			get: function() {
				return JSON.stringify(json, null, 4);
			},
			set: function(newValue) {
				json = newValue;
			},
			enumerable: true,
			configurable: true
		});

		Object.keys(json).forEach(function(key) {
			Object.defineProperty(package, key, {
				get: function() {
					return json[key];
				},
				set: function(newValue) {
					json[key] = newValue;
				},
				enumerable: true,
				configurable: true
			});
		});

		/*
		 *	Add version getter/setters
		 */

		['mayorVersion', 'minorVersion', 'buildVersion']
		.forEach(function(key, index) {
			Object.defineProperty(package, key, {
				get: function() {
					var verArr = json.version.split('.');
					return verArr[index];
				},
				set: function(newValue) {
					var verArr = json.version.split('.');
					verArr[index] = newValue;
					json.version = verArr.join('.');
				},
				enumerable: true,
				configurable: true
			});

		});
		return package;
	})();

/*
 * Increment version build
 */

package.buildVersion++;

/*
 *	Write new package Obj to ./package.json
 */

fs.writeFile(process.cwd() + '/package.json', package.json, function (err) {
  if (err) {
  	throw err;
  }
  console.log("%s new version %s",package.name.toUpperCase(), package.version);
});