/**
 * Creates an object which can be mixed in to other objects to created shared functionality.
 *
 * The mixin can extend the target with new properties or methods, or can modify the pre-existing behaviour by applying
 * methods to run before, after, around or instead of the original.
 *
 * When defining a mixin, there are several key words to define method modifiers:
 *
 * - `before`: {Object.<String,Function>}
 *   - defines methods to be executed before the original function. It has the same function signature (it is given the
 *     same arguments list) as the original, but can not modify the arguments passed to the original, nor change whether
 *     the function is executed.
 * - `after`: {Object.<String,Function>}
 *   - The same as `before`, this has the same signature, but can not modify the return value of the function.
 * - `around`: {Object.<String,Function>}
 *   - defines methods to be executed 'around' the original. The original function is passed as the first argument,
 *     followed by the original arguments. The modifier function may change the arguments to be passed to the original,
 *     may modify the return value, and even can decide not to execute the original. Given the power that this provides,
 *     use with care!
 * - `requires`: {Array.<String>}
 *   - an array of property names which must exist on the target object. Basically defines an expected interface. During
 *     development, a failed expectation here throws an error, but in production the check is skipped.
 * - `requirePrototype`: {Object}
 *   - this prototype should be present on the target object's prototype chain. can be used to specify what 'class'
 *     target should be or from what prototype it should inherit from During development, a failed expectation here throws
 *     an error, but in production the check is skipped.
 * - `override`: {Object.<String,*>}
 *   - properties or methods which specifically should override the values already defined on the target object.
 * - `defaults`: {Object.<String,*>}
 *   - properties or methods which should be applied to the target object only if they do not already exist on that
 *     object itself (does not include properties which exist in the prototype chain)
 * - `merge`: {Object.<String,Array|Object|String}
 *   - a map of objects or arrays apply to the target object, merging with existing properties if they already exist.
 *     Merge strategy is:
 *     - Arrays are concatenated, ensuring uniqueness.
 *     - Objects are extended without replacing existing keys. That is, it uses `_.defaults(target.obj, mixin.obj)`.
 *     - Strings are treated like space-separated token lists: concatenated, ensuing uniqueness.
 *
 * All other keys are copied onto the target object unless that key already exists. In this case, an error is thrown. If
 * overriding these keys is desired, then it should be defined in the `override` block. If a default implementation is
 * desired, then it should be defined in the `defaults` block.
 *
 * To use a mixin, call its `applyTo` method with a target object as the first parameter.
 *
 * @example
 *
 *    myMixin = new Mixin({
 *      after: {
 *        foo: function () {}
 *      }
 *    });
 *
 *    myMixin.applyTo(myClass.prototype);
 *
 * If custom code is required for your mixin, then defining a key named 'applyTo' allows a custom method to be executed
 * when the mixin is applied. This method is passed two arguments: the target object and any options defined by the
 * calling code:
 *
 * @example
 *
 *    myMixin = new Mixin({
 *      after: {
 *        // if defined, these are still applied (first)
 *        foo: function () {}
 *      },
 *      applyTo: function (obj, options) {
 *        this.extend(obj, {
 *          zoom: function () {
 *            this.width *= options.zoom;
 *          }
 *        });
 *      }
 *    });
 *
 * All of the standard modifier names (eg: after, around, before) are available in the context, as well as `extend`.
 */
!function(mixinFactory) {
  var exp = mixinFactory(require("underscore"));
  module.exports = exp;
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
        var errors = requires.map(function(prop) {
          return prop in obj ? void 0 : prop;
        }).filter(Boolean);
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