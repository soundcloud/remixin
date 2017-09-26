/*!
 * Remixin v1.0.3
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
  var SPECIAL_KEYS = ['before', 'after', 'around', 'requires', 'override', 'defaults', 'applyTo', 'requirePrototype', 'merge'],
      whitespace = /\s+/;

  function Mixin(/* Mixin, Mixin, ...  config */) {
    this.mixins = _.initial(arguments);
    this.properties = _.last(arguments);
  }

  _.extend(Mixin.prototype, {

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
          var args = new Array(arguments.length);
          for (var i = 0; i < arguments.length; ++i) args[i] = arguments[i];
          exec(modifierFn, this, args);
          return exec(origFn, this, args);
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
          var args = new Array(arguments.length);
          for (var i = 0; i < arguments.length; ++i) args[i] = arguments[i];
          var ret = exec(origFn, this, args);
          exec(modifierFn, this, args);
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
          var l = arguments.length;
          var args = new Array(l + 1);

          args[0] = origFn.bind(this);

          for (var i = 0; i < l; ++i) {
            args[i + 1] = arguments[i];
          }
          return exec(modifierFn, this, args);
        };
      });
    },

    override: function (obj, properties) {
      // apply the override properties
      _.extend(obj, properties);
    },

    defaults: function (obj, properties) {
      _.each(properties, function (value, prop) {
        if (!obj.hasOwnProperty(prop)) {
          obj[prop] = value;
        }
      });
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

        var errors = _.compact(requires.map(function (prop) {
          if (!(prop in obj)) {
            return prop;
          }
        }));
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
          throw new Error('Object does not inherit from required prototype');
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

  function exec(fn, context, args) {
    switch (args.length) {
      case 0:  return fn.call(context);
      case 1:  return fn.call(context, args[0]);
      case 2:  return fn.call(context, args[0], args[1]);
      case 3:  return fn.call(context, args[0], args[1], args[2]);
      case 4:  return fn.call(context, args[0], args[1], args[2], args[3]);
      default: return fn.apply(context, args);
    }
  }

  /**
   * Combine two arrays, ensuring uniqueness of the new values being added.
   * @param  {?*} existingVal
   * @param  {Array} value
   * @return {Array}
   */
  function mergeArrays(existingVal, value) {
    return existingVal == null
         ? value.slice()
         : uniqueConcat(lift(existingVal), value);
  }

  /**
   * Concatenate two arrays, but only including values from the second array not present in the first.
   * This returns a new object: it does not modify either array.
   * @param  {Array} arr1
   * @param  {Array} arr2
   * @return {Array}
   */
  function uniqueConcat(arr1, arr2) {
    return arr1.concat(_.difference(arr2, arr1));
  }

  /**
   * Combine two strings, treating them as a space separated list of tokens.
   * @param  {?String} existingVal
   * @param  {String} value
   * @return {String}
   */
  function mergeTokenList(existingVal, value) {
    return existingVal == null
         ? value
         : mergeArrays(tokenize(existingVal), tokenize(value)).join(' ');
  }

  /**
   * Create a new object which has all the properties of the two passed in object, preferring the first object when
   * there is a key collision.
   * @param  {?Object} existingVal
   * @param  {?Object} value
   * @return {Object}
   */
  function mergeObjects(existingVal, value) {
    return _.extend({}, value, existingVal);
  }

  /**
   * Convert a string of space separated tokens into an array of tokens.
   * @param  {String} str
   * @return {Array.<String>}
   */
  function tokenize(str) {
    return _.compact(str.split(whitespace));
  }

  /**
   * Lift a value into an array, if it is not already one.
   * @param  {*} value
   * @return {Array}
   */
  function lift(value) {
    return _.isArray(value) ? value : [ value ];
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
