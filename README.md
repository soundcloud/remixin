## Remixin

Remixin is the aspect-oriented mixin library developed and in use at [SoundCloud][soundcloud]. It is inspired by Twitter's [advice.js][advice] and [Joose][joose].

For an introduction about why you'd want to use a mixin library, Angus Croll and Dan Webb from Twitter gave a good [talk about the concept][slides] and Angus [blogged on the subject][blog].

## Setup

Remixin runs in the browser and NodeJS (available as an npm module). It only has one dependency: underscore.js (or lodash). This library is included automatically as a dependency in node, but is not bundled for browser usage, since you likely are already using underscore or lodash in your application anyway. To use Remixin in the browser, it uses dependency injection to get access to underscore:

```javascript
// node.js
var Mixin = require('remixin'); // ready to go!
```

```html
<!-- used in the browser -->
<html>
<script src="underscore.js"></script>
<script src="remixin-global.js"></script> <!-- creates window.Remixin -->
<script>
  Mixin = Remixin(_); // pass underscore to the global object and it returns the class ready to go.
</script>
```

Alternatively, if you're using requirejs, browserify or something similar for browser usage, as long as `require('underscore')` will return something useful, you can use the commonjs version the same as node.

### Files

There are 4 files provided in the repository:

- `remixin-cjs.js`
- `remixin-global.js`
- `remixin-dev-cjs.js`
- `remixin-dev-global.js`

- Files with 'cjs' use CommonJS modules. Remixin is exported on `module.exports` and gets access to underscore via `require('underscore')`.
- Files with 'global' export Remixin as a property on the global object (`window`, in the browser). This needs to be injected with underscore before use, as shown above.
- Files with 'dev' are for development mode: they are not minified, and include error checking.

Since it's not a real JS library readme if there's not a mention of its footprint, **Remixin is 748 bytes gzipped**.

## Usage

- Create a new mixin using `mixin = new Mixin(modifiers)`
- Apply a mixin to an object, using `mixin.applyTo(object)`
- Pass options to a mixin which has a custom apply method using `mixin.applyTo(object, options)`
- Curry options into a mixin using `curried = mixin.withOptions(options)`
- Combine mixins by using `combined = new Mixin(mixin1, [mixin2, ...], modifiers)`

### Modifiers

When defining a mixin, there are several key words to define method modifiers:

- `before`: `{Object.<String,Function>}`
  - defines methods to be executed before the original function. It has the same function signature (it is given the
    same arguments list) as the original, but can not modify the arguments passed to the original, nor change whether
    the function is executed.
- `after`: `{Object.<String,Function>}`
  - The same as `before`, this has the same signature, but can not modify the return value of the function.
- `around`: `{Object.<String,Function>}`
  - defines methods to be executed 'around' the original. The original function is passed as the first argument,
    followed by the original arguments. The modifier function may change the arguments to be passed to the original,
    may modify the return value, and even can decide not to execute the original. Given the power that this provides,
    use with care!
- `requires`: `{Array.<String>}`
  - an array of property names which must exist on the target object. Basically defines an expected interface.
- `requirePrototype`: `{Object}`
  - this prototype should be present on the target object's prototype chain. can be used to specify what 'class'
    target should be or from what prototype it should inherit from.
- `override`: `{Object.<String,*>}`
  - properties or methods which specifically should override the values already defined on the target object.
- `defaults`: `{Object.<String,*>}`
  - properties or methods which should be applied to the target object only if they do not already exist on that
    object or in its prototype chain.
- `merge`: `{Object.<String,Array|Object|String}`
  - a map of objects, arrays or strings to apply to the target object, merging with existing properties if they already
    exist. The merge strategy used depends on the data type used in the mixin:
    - Arrays are concatenated, ensuring uniqueness.
    - Objects are extended without replacing existing keys. That is, it uses `_.defaults(target.obj, mixin.obj)`.
    - Strings are treated like space-separated token lists: concatenated, ensuring uniqueness.

All other keys are copied onto the target object unless that key already exists. If overriding these keys is desired,
then it should be defined in the `override` block. If a default implementation is desired, then it should be defined in
the `defaults` block.

If using the development build of Remixin, incorrect use of these modifiers will throw an error. For example, if a
field declared in `requires` is not found, or trying to apply a `before` on a non-function. The production build skips
these checks altogether, either failing silently or creating unwanted behaviour when used. For this reason, you should
definitely use the development version while working.

### Custom `applyTo`

If custom code is required for your mixin, then defining a key named 'applyTo' allows a custom method to be executed
when the mixin is applied. This method is passed two arguments: the target object and any options defined by the
calling code:

```javascript
zoomable = new Mixin({
 applyTo: function (obj, options) {
   this.extend(obj, {
     zoom: function () {
       this.width *= options.zoomRatio;
       this.height *= options.zoomRatio;
     }
   });
 }
});

zoomable.applyTo(MyCanvasObject.prototype, { zoomRatio: 2 });
```

All of the standard modifier names (eg: after, around, before) are available in the context, as well as `extend` to add
new properties.

### Currying options

Taking the example from above, sometimes it's more convenient to have the options curried into the mixin already. For
this, use `.withOptions` which will return a new mixin with those options stored. For example:

```js
var standardDPI = zoomable.withOptions({ zoomRatio: 1});
var highDPI = zoomable.withOptions({ zoomRatio: 2 });
```

### Combining mixins

Sometimes, one mixin will necessitate the target object also having another mixin. For example, you might have a mixin
which gives a View the behaviour of a drop-down menu. Drop-down menus have some shared behaviour with other overlays,
such as modal dialogues. These can be combined into a single mixin, to hide the implementation from the class which
requires the combined behaviour:

```javascript
overlay = new Mixin({
  merge: {
    events: {
      'click .closeButton': 'onCloseClick'
    }
  },
  show: function () { ... },
  hide: function () { ... },
  onCloseClick: function () {
    this.hide();
  }
});

dropDownMenu = new Mixin(overlay, {
  after: {
    onCloseClick: function () {
      this.parentButton.focus();
    }
  }
});

ProfileButton = View.extend({ ... });
dropDownMenu.applyTo(ProfileButton.prototype);
```

Any number of mixins can be combined into one:

```javascript
megaMixin = new Mixin(mixin1, mixin2, mixin3, mixin4, {});
```

## Development

To create the builds:

```shell
make
```

To run the tests in node:

```shell
make test
```

To run the tests in your browser:

```shell
npm run test-server
```

...and then open your browser to http://127.0.0.1:8080/test.html

[advice]: https://github.com/flightjs/flight/blob/master/lib/advice.js
[blog]: https://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/
[joose]: http://joose.it/
[slides]: https://speakerdeck.com/anguscroll/how-we-learned-to-stop-worrying-and-love-javascript
[soundcloud]: https://soundcloud.com
