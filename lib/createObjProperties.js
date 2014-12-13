var util = require('util'),
    createProperties = function createProperties(d, a, obj) {
    function isNotObject(o) {
        return typeof o !== 'object';
    };

    var r = a.reduce(function(o, p) {

        p.configurable = (typeof p.configurable === 'undefined') ? false : p.configurable;
        p.enumerable = (typeof p.enumerable === 'undefined') ? false : p.enumerable;
        p.writable = (typeof p.writable === 'undefined') ? false : p.writable;

        switch (true) {
            case util.isArray(d[p.key]):
            console.log('isArray')
                break;
            case util.isRegExp(d[p.key]):
             console.log('isRegExp')
                break;
            case util.isDate(d[p.key]):
             console.log('isDate')
                break;
            case util.isError(d[p.key]):
            console.log('isError')
                break;
            case isNotObject(d[p.key]):
                break;
            default:
                var props = Object.keys(d[p.key]).map(function (k) {
                    return {
                        key: k,
                        configurable: p.configurable,
                        enumerable: p.enumerable,
                        writable: p.writable
                    }
                });
                d[p.key] = createProperties(d[p.key], props, d[p.key]);
        }
        o[p.key] = {
            configurable: p.configurable,
            enumerable: p.enumerable,
            writable: p.writable,
        };
        if (d[p.key]) {
            o[p.key].value = d[p.key];
        };
        if (p.get) {
            o[p.key].get = p.get;
        };
        if (p.set) {
            o[p.key].set = p.set;
        };
        return o;
    }, {});
    if(obj) {
        Object.defineProperties(obj, r);
        return obj;
    } else {
        return r;
    }
}

module.exports = createProperties;