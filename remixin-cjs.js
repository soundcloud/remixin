!function(e) {
    var t = e(require("underscore"));
    module.exports = t;
}(function(e) {
    function t() {
        this.mixins = e.initial(arguments), this.properties = e.last(arguments);
    }
    function r(e, t) {
        this.applyTo = function(r) {
            e.applyTo(r, t);
        };
    }
    var n = [ "before", "after", "around", "requires", "override", "defaults", "applyTo", "requirePrototype", "merge" ];
    return e.extend(t.prototype, {
        mixins: null,
        properties: null,
        applyTo: function(t, r) {
            var n = this.properties;
            this.defaults(t, n.defaults), this.extend(t, n), this.merge(t, n.merge), e.invoke(this.mixins, "applyTo", t), 
            [ "requires", "requirePrototype", "override", "before", "after", "around" ].forEach(function(e) {
                this[e](t, n[e]);
            }, this), n.applyTo && n.applyTo.call(this, t, r);
        },
        withOptions: function(e) {
            return new r(this, e);
        },
        before: function(t, r) {
            e.each(r, function(e, r) {
                var n = t[r];
                t[r] = function() {
                    return e.apply(this, arguments), n.apply(this, arguments);
                };
            });
        },
        after: function(t, r) {
            e.each(r, function(e, r) {
                var n = t[r];
                t[r] = function() {
                    var t = n.apply(this, arguments);
                    return e.apply(this, arguments), t;
                };
            });
        },
        around: function(t, r) {
            e.each(r, function(e, r) {
                var n = t[r];
                t[r] = function() {
                    var t = arguments.length, r = Array(t + 1), i = 0;
                    for (r[0] = n.bind(this); t > i; ++i) r[i + 1] = arguments[i];
                    return e.apply(this, r);
                };
            });
        },
        override: function(t, r) {
            e.extend(t, r);
        },
        defaults: function(t, r) {
            e.defaults(t, r);
        },
        merge: function(t, r) {
            e.each(r, function(r, n) {
                if (null != r) {
                    var i = t[n];
                    e.isArray(r) ? (void 0 === i ? t[n] = i = [] : e.isArray(i) || (t[n] = i = [ i ]), 
                    Array.prototype.push.apply(i, e.difference(r, i))) : e.isString(r) ? t[n] = void 0 === i ? r : i + " " + e.difference(r.split(" "), i.split(" ")).join(" ") : (i || (t[n] = i = {}), 
                    e.defaults(i, r));
                }
            });
        },
        extend: function(t, r) {
            e.each(r, function(e, r) {
                n.indexOf(r) < 0 && (t[r] = e);
            });
        },
        requires: function(e, t) {
        },
        requirePrototype: function(e, t) {}
    }), r.prototype = t.prototype, t;
});