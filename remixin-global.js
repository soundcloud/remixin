!function(n) {
    var t, e = this, i = n;
    t = e.Mixin, e.Mixin = i, i.noConflict = function() {
        return e.Mixin = t, i;
    };
}(function(n) {
    function t() {
        this.mixins = n.initial(arguments), this.properties = n.last(arguments);
    }
    function e(n, t) {
        this.applyTo = function(e) {
            n.applyTo(e, t);
        };
    }
    var i = [ "before", "after", "around", "requires", "override", "defaults", "applyTo", "requirePrototype", "merge" ];
    return n.extend(t.prototype, {
        mixins: null,
        properties: null,
        applyTo: function(t, e) {
            var i = this.properties;
            this.defaults(t, i.defaults), this.extend(t, i), this.merge(t, i.merge), n.invoke(this.mixins, "applyTo", t), 
            [ "requires", "requirePrototype", "override", "before", "after", "around" ].forEach(function(n) {
                this[n](t, i[n]);
            }, this), i.applyTo && i.applyTo.call(this, t, e);
        },
        withOptions: function(n) {
            return new e(this, n);
        },
        before: function(t, e) {
            n.each(e, function(n, e) {
                var i = t[e];
                t[e] = function() {
                    return n.apply(this, arguments), i.apply(this, arguments);
                };
            });
        },
        after: function(t, e) {
            n.each(e, function(n, e) {
                var i = t[e];
                t[e] = function() {
                    var t = i.apply(this, arguments);
                    return n.apply(this, arguments), t;
                };
            });
        },
        around: function(t, e) {
            n.each(e, function(n, e) {
                var i = t[e];
                t[e] = function() {
                    var t = arguments.length, e = Array(t + 1), r = 0;
                    for (e[0] = i.bind(this); t > r; ++r) e[r + 1] = arguments[r];
                    return n.apply(this, e);
                };
            });
        },
        override: function(t, e) {
            n.extend(t, e);
        },
        defaults: function(t, e) {
            n.defaults(t, e);
        },
        merge: function(t, e) {
            n.each(e, function(e, i) {
                if (null != e) {
                    var r = t[i];
                    n.isArray(e) ? (void 0 === r ? t[i] = r = [] : n.isArray(r) || (t[i] = r = [ r ]), 
                    Array.prototype.push.apply(r, n.difference(e, r))) : n.isString(e) ? t[i] = void 0 === r ? e : r + " " + n.difference(e.split(" "), r.split(" ")).join(" ") : (r || (t[i] = r = {}), 
                    n.defaults(r, e));
                }
            });
        },
        extend: function(t, e) {
            n.each(e, function(n, e) {
                i.indexOf(e) < 0 && (t[e] = n);
            });
        },
        requires: function(n, t) {
            console.log("--------"), console.log(t), console.log(n);
        },
        requirePrototype: function(n, t) {}
    }), e.prototype = t.prototype, t;
});