/*jslint node: true, maxcomplexity: 5 */
'use strict';

var util = require('util');

function createProperties(d, a, obj) {

    obj = obj || d;

    function addDescriptors(d, o, p) {
        if (p.key) {
            var key = p.key;
            delete p.key;

            o[key] = o[key] || {};

            if (d[key]) {
                o[key].value = d[key];
            }

            var keys = Object.keys(p);
            for (var i = 0; i < keys.length; i++) {
                o[key][keys[i]] = p[keys[i]];
            }

        }
        return o;
    }

    var r = a.reduce(function(o, p) {

        if (
            typeof d[p.key] === 'object' &&
            d.hasOwnProperty(p.key) &&
            !util.isArray(d[p.key]) &&
            !util.isRegExp(d[p.key]) &&
            !util.isDate(d[p.key]) &&
            !util.isError(d[p.key])
        ) {

            var props = new Array(0),
                k = Object.keys(d[p.key]);

            for (var i = 0; i < k.length; i++) {
                var attrs = {
                    key: k[i],
                    writable: p.writable,
                    enumerable: p.enumerable,
                    configurable: p.configurable
                };
                props[props.length] = addDescriptors(d[p.key], attrs, p.key);
            }

            d[p.key] = createProperties(d[p.key], props);

        }
        o = addDescriptors(d, o, p);

        return o;

    }, {});

    if (obj) {
        Object.defineProperties(obj, r);
        return obj;
    } else {
        return r;
    }
}

module.exports = createProperties;