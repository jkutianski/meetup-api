/*jslint node: true, maxcomplexity: 7 */
'use strict';


module.exports.requireOpt = function(modules, cb) {
	let _loaded = {};

	if(Array.isArray(modules)) {

		_loaded = modules.reduce((_loaded, _module) => {
			try {
				_loaded[_module] = require(_module);
			} catch(error) {
				if (Object.prototype.toString.call(_module) !== '[object String]') {
					throw(error);
				}
				return null;
			}
			return _loaded;		
		}, {});

	} else {

		try {
			_loaded[modules] = require(modules);
		} catch(error) {
			if (Object.prototype.toString.call(modules) !== '[object String]') {
				throw(error);
			}
			_loaded[modules] = null;	
		}
	}

	return cb && cb(_loaded) || !cb && (_loaded.length === 1 && _loaded[0] || _loaded) || null;

};