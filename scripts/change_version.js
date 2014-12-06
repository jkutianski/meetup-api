var packageJSON = require(process.cwd() + '/package.json')
	fs = require('fs'),
	version = packageJSON.version.split('.'),
	build = version[2];

packageJSON.version = version.slice(0,2).join('.');
packageJSON.version += ('.' + ++build);

fs.writeFile(process.cwd() + '/package.json', JSON.stringify(packageJSON, null, 4), function (err) {
  if (err) throw err;
  console.log("%s new version %s",packageJSON.name.toUpperCase(), packageJSON.version);
});