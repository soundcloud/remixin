## Remixin [![version][npm badge]][npm] [![build status][travis badge]][travis]

Remixin is the aspect-oriented mixin library developed and in use at [SoundCloud][soundcloud]. It is inspired by Twitter's [advice.js][advice] and [Joose][joose].

For an introduction about why you'd want to use a mixin library, Angus Croll and Dan Webb from Twitter gave a good [talk about the concept][slides] and Angus [blogged on the subject][blog].

## Installation

Install the package via npm:

```shell
npm install remixin
```

And then import it:

```js
import { Mixin } from 'remixin';
```

Alternatively, download a browser-ready version from the unpkg CDN:

```html
<script src="https://unpkg.com/underscore"></script> <!-- creates window._ -->
<script src="https://unpkg.com/remixin"></script> <!-- creates window.remixin -->
```

([Underscore.js][underscore] is a dependency and needs to be included first.)

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
  - an array of property names which must exist on the target object (or its prototype). Basically defines an expected
    interface.
- `requirePrototype`: `{Object}`
  - this prototype should be present on the target object's prototype chain. can be used to specify what 'class'
    target should be or from what prototype it should inherit from.
- `override`: `{Object.<String,*>}`
  - properties or methods which specifically should override the values already defined on the target object.
- `defaults`: `{Object.<String,*>}`
  - properties or methods which should be applied to the target object only if they do not already exist on that
    object. Properties defined in the prototype chain will be overridden.
- `merge`: `{Object.<String,Array|Object|String}`
  - a map of objects, arrays or strings to apply to the target object, merging with existing properties if they already
    exist. The merge strategy used depends on the data type used in the mixin:
    - Arrays are concatenated, ensuring uniqueness.
    - Objects are extended without replacing existing keys. That is, it uses `_.extend({}, mixin.obj, target.obj)`.
    - Strings are treated like space-separated token lists: concatenated, ensuring uniqueness.

All other keys are copied onto the target object unless that key already exists. If overriding these keys is desired,
then it should be defined in the `override` block. If a default implementation is desired, then it should be defined in
the `defaults` block.

Incorrect use of these modifiers will throw an error if `Mixin.debug` is set to `true`. For example, if a field declared in `requires` is not found, or if a `before` is applied on a non-function. By default, `Mixin.debug` is `false`.

### Custom `applyTo`

If custom code is required for your mixin, then defining a key named `applyTo` allows a custom method to be executed
when the mixin is applied. This method is passed two arguments: the target object and any options defined by the
calling code:

```js
zoomable = new Mixin({
 applyTo(obj, options) {
   this.extend(obj, {
     zoom() {
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

```js
overlay = new Mixin({
  merge: {
    events: {
      'click .closeButton': 'onCloseClick'
    }
  },
  show() { ... },
  hide() { ... },
  onCloseClick() {
    this.hide();
  }
});

dropDownMenu = new Mixin(overlay, {
  after: {
    onCloseClick() {
      this.parentButton.focus();
    }
  }
});

ProfileButton = View.extend({ ... });
dropDownMenu.applyTo(ProfileButton.prototype);
```

Any number of mixins can be combined into one:

```js
megaMixin = new Mixin(mixin1, mixin2, mixin3, mixin4, {});
```

## Development

To build the source:

```shell
make
```

To run the tests:

```shell
make test
```

To see a coverage report:

```shell
make coverage
```

[npm]: https://www.npmjs.org/package/remixin
[npm badge]: https://img.shields.io/npm/v/remixin.svg
[travis]: https://travis-ci.org/soundcloud/remixin
[travis badge]: https://img.shields.io/travis/soundcloud/remixin.svg
[advice]: https://github.com/flightjs/flight/blob/master/lib/advice.js
[blog]: https://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/
[joose]: http://joose.it/
[slides]: https://speakerdeck.com/anguscroll/how-we-learned-to-stop-worrying-and-love-javascript
[soundcloud]: https://soundcloud.com
[underscore]: https://underscorejs.org
