/*!
 * Remixin
 * (c) SoundCloud 2015
 * Remixin may be freely distributed under the MIT license.
 */
(function (mixinFactory) {
  var global = this,
      previousMixin,
      exp = __INJECTION__
          ? mixinFactory
          : mixinFactory(__EXPORT__ ? require('underscore') : global._);

  if (__EXPORT__) {
    module.exports = exp;
  } else {
    previousMixin = global.Remixin;
    global.Remixin = exp;
    exp.noConflict = function () {
      global.Remixin = previousMixin;
      return exp;
    };
  }
}(function (_) {
  var SPECIAL_KEYS = ['before', 'after', 'around', 'requires', 'override', 'defaults', 'applyTo', 'requirePrototype', 'merge'];

  function Mixin(/* Mixin, Mixin, ...  config */) {
    this.mixins = _.initial(arguments);
    this.properties = _.last(arguments);
  }

  _.extend(Mixin.prototype, {

    mixins: null,
    properties: null,

    applyTo: function (obj, options) {
      var props = this.properties;

      this.defaults(obj, props.defaults);
      this.extend(obj, props);
      this.merge(obj, props.merge);

      _.invoke(this.mixins, 'applyTo', obj);

      // shortcut for calling all these functions with the properties with corresponding keys
      // this.requires(obj, props.requires);
      ['requires', 'requirePrototype', 'override', 'before', 'after', 'around'].forEach(function (fnName) {
        this[fnName](obj, props[fnName]);
      }, this);

      if (props.applyTo) {
        props.applyTo.call(this, obj, options);
      }
    },

    withOptions: function (options) {
      return new CurriedMixin(this, options);
    },

    before: function (obj, methods) {
      // apply the befores
      _.each(methods, function (modifierFn, prop) {
        if (__DEBUG__) {
          __assertFunction__(obj, prop);
        }
        var origFn = obj[prop];
        obj[prop] = function () {
          modifierFn.apply(this, arguments);
          return origFn.apply(this, arguments);
        };
      });
    },

    after: function (obj, methods) {
      // apply the afters
      _.each(methods, function (modifierFn, prop) {
        if (__DEBUG__) {
          __assertFunction__(obj, prop);
        }
        var origFn = obj[prop];
        obj[prop] = function () {
          var ret = origFn.apply(this, arguments);
          modifierFn.apply(this, arguments);
          return ret;
        };
      });
    },

    around: function (obj, methods) {
      // apply the arounds
      _.each(methods, function (modifierFn, prop) {
        if (__DEBUG__) {
          __assertFunction__(obj, prop);
        }
        var origFn = obj[prop];

        obj[prop] = function () {
          for (var i = 0, l = arguments.length, args = new Array(l + 1); i < l; ++i) {
            args[i + 1] = arguments[i];
          }
          args[0] = origFn.bind(this);
          return modifierFn.apply(this, args);
        };
      });
    },

    override: function (obj, properties) {
      // apply the override properties
      _.extend(obj, properties);
    },

    defaults: function (obj, properties) {
      _.defaults(obj, properties);
    },

    merge: function (obj, properties) {
      _.each(properties, function (value, prop) {
        if (value == null) {
          return;
        }
        if (__DEBUG__) {
          __assertValidMergeValue__(value);
        }
        var existingVal = obj[prop];
        obj[prop] = _.isArray(value)  ? mergeArrays(existingVal, value)
                  : _.isString(value) ? mergeTokenList(existingVal, value)
                                      : mergeObjects(existingVal, value);
      });
    },

    extend: function (obj, properties) {
      // apply the regular properties
      var toCopy = _.omit(properties, SPECIAL_KEYS);
      if (__DEBUG__) {
        Object.keys(toCopy).forEach(function (prop) {
          if (obj[prop] != null) {
            throw new Error('Mixin overrides existing property "' + prop + '"');
          }
        });
      }
      _.extend(obj, toCopy);
    },

    requires: __DEBUG__ ? function (obj, requires) {
      // check the requires -- this is only checked in debug mode.
      if (requires) {
        if (!_.isArray(requires)) {
          throw new Error('requires should be an array of required property names');
        }

        var errors = _.difference(requires, Object.keys(obj));
        if (errors.length) {
          throw new Error('Object is missing required properties: "' + errors.join('", "') + '"');
        }
      }
    } : _.noop,

    requirePrototype: __DEBUG__ ? function (obj, requirePrototype) {
      // check the required prototypes -- this is only checked in debug mode.
      if (requirePrototype) {
        if (!_.isObject(requirePrototype)) {
          throw new Error('requirePrototype should be an object');
        }
        if (!(requirePrototype === obj || requirePrototype.isPrototypeOf(obj))) {
          throw new Error('Object is not inherited from required prototype');
        }
      }
    } : _.noop
  });

  function CurriedMixin(mixin, options) {
    this.applyTo = function(obj) {
      mixin.applyTo(obj, options);
    };
  }
  CurriedMixin.prototype = Mixin.prototype;

  function mergeArrays(existingVal, value) {
    if (existingVal == null) {
      return value.slice();
    } else if (!_.isArray(existingVal)) {
      // lift into an array
      existingVal = [existingVal];
    }
    return uniqueConcat(existingVal, value);
  }

  function uniqueConcat(arr1, arr2) {
    Array.prototype.push.apply(arr1, _.difference(arr2, arr1));
    return arr1;
  }

  function mergeTokenList(existingVal, value) {
    return existingVal == null
         ? value
         : mergeArrays(existingVal.split(/\s+/), value.split(/\s+/)).join(' ');
  }

  function mergeObjects(existingVal, value) {
    return _.defaults(existingVal || {}, value);
  }

  function __assertValidMergeValue__(value) {
    var isInvalid = (!_.isObject(value) && !_.isString(value)) || ['isRegExp', 'isDate', 'isFunction'].some(function (fnName) {
      return _[fnName](value);
    });
    if (isInvalid) {
      throw new Error('Unsupported data type for merge');
    }
  }
  function __assertFunction__(obj, property) {
    if (!_.isFunction(obj[property])) {
      throw new Error('Object is missing function property "' + property + '"');
    }
  }
  return Mixin;
}));
