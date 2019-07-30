/*!
 * Remixin v1.0.3
 * (c) SoundCloud 2015
 * Remixin may be freely distributed under the MIT license.
 */
import _ from 'underscore';

const SPECIAL_KEYS = ['before', 'after', 'around', 'requires', 'override', 'defaults', 'applyTo', 'requirePrototype', 'merge'];

export class Mixin {
  constructor(/* Mixin, Mixin, ...  config */) {
    this.mixins = _.initial(arguments);
    this.properties = _.last(arguments);
  }

  applyTo(obj, options) {
    const props = this.properties;

    this.defaults(obj, props.defaults);
    this.extend(obj, props);
    this.merge(obj, props.merge);

    _.invoke(this.mixins, 'applyTo', obj);

    // shortcut for calling all these functions with the properties with corresponding keys
    // this.requires(obj, props.requires);
    ['requires', 'requirePrototype', 'override', 'before', 'after', 'around'].forEach((fnName) => {
      this[fnName](obj, props[fnName]);
    });

    if (props.applyTo) {
      props.applyTo.call(this, obj, options);
    }
  }

  withOptions(options) {
    return new CurriedMixin(this, options);
  }

  before(obj, methods) {
    // apply the befores
    _.each(methods, (modifierFn, prop) => {
      if (Mixin.debug) {
        __assertFunction__(obj, prop);
      }
      const origFn = obj[prop];
      obj[prop] = function (...args) {
        modifierFn.apply(this, args);
        return origFn.apply(this, args);
      };
    });
  }

  after(obj, methods) {
    // apply the afters
    _.each(methods, (modifierFn, prop) => {
      if (Mixin.debug) {
        __assertFunction__(obj, prop);
      }
      const origFn = obj[prop];
      obj[prop] = function (...args) {
        const ret = origFn.apply(this, args);
        modifierFn.apply(this, args);
        return ret;
      };
    });
  }

  around(obj, methods) {
    // apply the arounds
    _.each(methods, (modifierFn, prop) => {
      if (Mixin.debug) {
        __assertFunction__(obj, prop);
      }
      const origFn = obj[prop];
      obj[prop] = function () {
        const args = [origFn.bind(this), ...arguments];
        return modifierFn.apply(this, args);
      };
    });
  }

  override(obj, properties) {
    // apply the override properties
    _.extend(obj, properties);
  }

  defaults(obj, properties) {
    _.each(properties, (value, prop) => {
      if (!obj.hasOwnProperty(prop)) {
        obj[prop] = value;
      }
    });
  }

  merge(obj, properties) {
    _.each(properties, (value, prop) => {
      if (value == null) {
        return;
      }
      if (Mixin.debug) {
        __assertValidMergeValue__(value);
      }
      const existingVal = obj[prop];
      obj[prop] = _.isArray(value)  ? mergeArrays(existingVal, value)
                : _.isString(value) ? mergeTokenList(existingVal, value)
                                    : mergeObjects(existingVal, value);
    });
  }

  extend(obj, properties) {
    // apply the regular properties
    const toCopy = _.omit(properties, SPECIAL_KEYS);
    if (Mixin.debug) {
      Object.keys(toCopy).forEach((prop) => {
        if (obj[prop] != null) {
          throw new Error(`Mixin overrides existing property "${prop}"`);
        }
      });
    }
    _.extend(obj, toCopy);
  }

  requires(obj, requires) {
    if (!Mixin.debug) return;

    // check the requires -- this is only checked in debug mode.
    if (requires) {
      if (!_.isArray(requires)) {
        throw new Error('requires should be an array of required property names');
      }

      const errors = _.compact(requires.map((prop) => {
        if (!(prop in obj)) {
          return prop;
        }
      }));
      if (errors.length) {
        throw new Error(`Object is missing required properties: "${errors.join('", "')}"`);
      }
    }
  }

  requirePrototype(obj, requirePrototype) {
    if (!Mixin.debug) return;

    // check the required prototypes -- this is only checked in debug mode.
    if (requirePrototype) {
      if (!_.isObject(requirePrototype)) {
        throw new Error('requirePrototype should be an object');
      }
      if (!(requirePrototype === obj || requirePrototype.isPrototypeOf(obj))) {
        throw new Error('Object does not inherit from required prototype');
      }
    }
  }
}

class CurriedMixin extends Mixin {
  constructor(mixin, options) {
    super(mixin, options);
    this.applyTo = (obj) => { mixin.applyTo(obj, options) };
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
  return _.compact(str.split(/\s+/));
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
  const isInvalid = (!_.isObject(value) && !_.isString(value)) || ['isRegExp', 'isDate', 'isFunction'].some((fnName) => (
    _[fnName](value)
  ));
  if (isInvalid) {
    throw new Error('Unsupported data type for merge');
  }
}

function __assertFunction__(obj, property) {
  if (!_.isFunction(obj[property])) {
    throw new Error(`Object is missing function property "${property}"`);
  }
}
