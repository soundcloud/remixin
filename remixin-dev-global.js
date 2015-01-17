/*!
 * Remixin
 * (c) SoundCloud 2015
 * Remixin may be freely distributed under the MIT license.
 */
!function(mixinFactory) {
  var previousMixin, global = this, exp = mixinFactory;
  previousMixin = global.Remixin;
  global.Remixin = exp;
  exp.noConflict = function() {
    global.Remixin = previousMixin;
    return exp;
  };
}(function(_) {
  function Mixin() {
    this.mixins = _.initial(arguments);
    this.properties = _.last(arguments);
  }
  function CurriedMixin(mixin, options) {
    this.applyTo = function(obj) {
      mixin.applyTo(obj, options);
    };
  }
  function __isInvalidMergeValue__(value) {
    return !_.isObject(value) && !_.isString(value) || [ "isRegExp", "isDate", "isFunction" ].some(function(fnName) {
      return _[fnName](value);
    });
  }
  var SPECIAL_KEYS = [ "before", "after", "around", "requires", "override", "defaults", "applyTo", "requirePrototype", "merge" ];
  _.extend(Mixin.prototype, {
    mixins: null,
    properties: null,
    applyTo: function(obj, options) {
      var props = this.properties;
      this.defaults(obj, props.defaults);
      this.extend(obj, props);
      this.merge(obj, props.merge);
      _.invoke(this.mixins, "applyTo", obj);
      // shortcut for calling all these functions with the properties with corresponding keys
      // this.requires(obj, props.requires);
      [ "requires", "requirePrototype", "override", "before", "after", "around" ].forEach(function(fnName) {
        this[fnName](obj, props[fnName]);
      }, this);
      props.applyTo && props.applyTo.call(this, obj, options);
    },
    withOptions: function(options) {
      return new CurriedMixin(this, options);
    },
    before: function(obj, methods) {
      // apply the befores
      _.each(methods, function(modifierFn, prop) {
        if (!_.isFunction(obj[prop])) {
          throw new Error('Object is missing function property "' + prop + '"');
        }
        var origFn = obj[prop];
        obj[prop] = function() {
          modifierFn.apply(this, arguments);
          return origFn.apply(this, arguments);
        };
      });
    },
    after: function(obj, methods) {
      // apply the afters
      _.each(methods, function(modifierFn, prop) {
        if (!_.isFunction(obj[prop])) {
          throw new Error('Object is missing function property "' + prop + '"');
        }
        var origFn = obj[prop];
        obj[prop] = function() {
          var ret = origFn.apply(this, arguments);
          modifierFn.apply(this, arguments);
          return ret;
        };
      });
    },
    around: function(obj, methods) {
      // apply the arounds
      _.each(methods, function(modifierFn, prop) {
        if (!_.isFunction(obj[prop])) {
          throw new Error('Object is missing function property "' + prop + '"');
        }
        var origFn = obj[prop];
        obj[prop] = function() {
          var l = arguments.length, args = new Array(l + 1), i = 0;
          args[0] = origFn.bind(this);
          for (;l > i; ++i) {
            args[i + 1] = arguments[i];
          }
          return modifierFn.apply(this, args);
        };
      });
    },
    override: function(obj, properties) {
      // apply the override properties
      _.extend(obj, properties);
    },
    defaults: function(obj, properties) {
      _.defaults(obj, properties);
    },
    merge: function(obj, properties) {
      _.each(properties, function(value, prop) {
        if (null != value) {
          if (__isInvalidMergeValue__(value)) {
            throw new Error("Unsupported data type for merge");
          }
          var existingVal = obj[prop];
          if (_.isArray(value)) {
            void 0 === existingVal ? obj[prop] = existingVal = [] : _.isArray(existingVal) || (// lift into an array
            obj[prop] = existingVal = [ existingVal ]);
            Array.prototype.push.apply(existingVal, _.difference(value, existingVal));
          } else {
            if (_.isString(value)) {
              obj[prop] = void 0 === existingVal ? value : existingVal + " " + _.difference(value.split(" "), existingVal.split(" ")).join(" ");
            } else {
              // object
              existingVal || (obj[prop] = existingVal = {});
              if (_.isArray(existingVal)) {
                throw new Error("Can not merge array with object");
              }
              _.defaults(existingVal, value);
            }
          }
        }
      });
    },
    extend: function(obj, properties) {
      // apply the regular properties
      _.each(properties, function(value, prop) {
        if (SPECIAL_KEYS.indexOf(prop) < 0) {
          if (prop in obj) {
            throw new Error('Mixin overrides existing property "' + prop + '"');
          }
          obj[prop] = value;
        }
      });
    },
    requires: function(obj, requires) {
      // check the requires -- this is only checked in debug mode.
      if (requires) {
        if (!_.isArray(requires)) {
          throw new Error("requires should be an array of required property names");
        }
        var errors = _.difference(requires, Object.keys(obj));
        if (errors.length) {
          throw new Error('Object is missing required properties: "' + errors.join('", "') + '"');
        }
      }
    },
    requirePrototype: function(obj, requirePrototype) {
      // check the required prototypes -- this is only checked in debug mode.
      if (requirePrototype) {
        if (!_.isObject(requirePrototype)) {
          throw new Error("requirePrototype should be an object");
        }
        if (requirePrototype !== obj && !requirePrototype.isPrototypeOf(obj)) {
          throw new Error("Object is not inherited from required prototype");
        }
      }
    }
  });
  CurriedMixin.prototype = Mixin.prototype;
  return Mixin;
});