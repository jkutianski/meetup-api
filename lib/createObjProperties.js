var util = require('util');

function createProperties(d, a, obj) {
    function isNotObject(o) {
        return typeof o !== 'object';
    };

    function addDescriptors(d, o, p) {
        o[p.key] = o[p.key] || {};

        if (p.hasOwnProperty('writable')) {
            o[p.key].writable = p.writable;
        };
        if (p.hasOwnProperty('enumerable')) {
            o[p.key].enumerable = p.enumerable;
        };
        if (p.hasOwnProperty('configurable')) {
            o[p.key].configurable = p.configurable;
        };
        if (d && d[p.key]) {
            o[p.key].value = d[p.key];
        };
        if (p.get) {
            o[p.key].get = p.get;
        };
        if (p.set) {
            o[p.key].set = p.set;
        };

        return o;
    };

    var r = a.reduce(function(o, p) {

        if (d.hasOwnProperty(p.key)) {
            switch (true) {
                case util.isArray(d[p.key]):
                    break;
                case util.isRegExp(d[p.key]):
                    break;
                case util.isDate(d[p.key]):
                    break;
                case util.isError(d[p.key]):
                    break;
                case isNotObject(d[p.key]):
                    break;
                default:
                    var props = Object.keys(d[p.key]).map(function(k) {
                        var o = {
                            key: k,
                            writable: p.writable,
                            enumerable: p.enumerable,
                            configurable: p.configurable
                        };
                        return addDescriptors(d[p.key], o, p.key);

                    });
                    d[p.key] = createProperties(d[p.key], props, d[p.key]);
            }
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