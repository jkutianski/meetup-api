var util = require('util');

function createProperties(d, a, obj) {
    function isNotObject(o) {
        return typeof o !== 'object';
    }

    function addDescriptors(d, o, p) {
        if (p.key) {
            var key = p.key;
            delete p.key;

            o[key] = o[key] || {};

            if (d[key]) {
                o[key].value = d[key];
            }

            Object.keys(p).forEach(function(descriptor) {
                o[key][descriptor] = p[descriptor];
            });
        }
        return o;
    }

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