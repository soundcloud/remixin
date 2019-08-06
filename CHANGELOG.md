## 2.0.0 (2019-08-06)

- Modernize and transpile Remixin's syntax.
- Stop including multiple build files in the npm package and version control.
- Replace the `__DEBUG__` global variable (that is used to toggle some debugging behavior) with a `debug` static property.

## 1.0.2 (2016-11-17)

- Optimize function calls by avoiding passing the `arguments` object around.

## 1.0.1 (2015-01-28)

- `merge` will not modify objects present on the target, rather it will create a new object or array and reassign the value. This fixes a bug whereby shared objects (for example, those on a parent class's prototype) were being mutated.
- `requires` takes into account properties which are defined in the prototype chain
- `defaults` will overwrite properties which are defined in the prototype chain

## 1.0.0 (2015-01-18)

- Initial release. 0.x.x is for wimps.
