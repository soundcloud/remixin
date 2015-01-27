/*globals it, describe, Mixin, expect */
/*eslint no-shadow: 0 */

describe('Remixin', function () {

  it('can be applied to objects', function () {
    var obj, hasBaz, fn = function () {};
    obj = {
      foo: 'FOO'
    };

    hasBaz = new Mixin({
      bar: fn,
      baz: 'BAZ'
    });

    hasBaz.applyTo(obj);

    expect(obj.baz).to.be('BAZ');  // The mixin should have added the new property
    expect(obj.bar).to.be(fn);     // The mixin should have added the new method
    expect(obj.foo).to.be('FOO');  // The mixin should not have modified the old property
  });

  it('are able to define before/after method modifiers', function () {
    var obj, mixin, fooOrder = [];

    obj = {
      foo: function () {
        fooOrder.push('b');
      }
    };

    mixin = new Mixin({
      before: {
        foo: function () {
          fooOrder.push('a');
        }
      },
      after: {
        foo: function () {
          fooOrder.push('c');
        }
      }
    });

    mixin.applyTo(obj);

    obj.foo();

    expect(fooOrder).to.eql(['a', 'b', 'c']);
  });

  it('does not allow befores/afters to modify arguments or return values', function () {
    var obj, mixin, fooOrder = [], ret;

    obj = {
      foo: function (arg) {
        fooOrder.push('b' + arg);
        return arg;
      }
    };

    mixin = new Mixin({
      before: {
        foo: function (arg) {
          fooOrder.push('a' + arg);
          return 'before';
        }
      },
      after: {
        foo: function (arg) {
          fooOrder.push('c' + arg);
          return 'after';
        }
      }
    });

    mixin.applyTo(obj);

    ret = obj.foo(1);

    expect(fooOrder).to.eql(['a1', 'b1', 'c1']);  // The argument should have been passed to each modifier
    expect(ret).to.be(1);                         // The return values of the modifiers should have been ignored
  });

  it('can apply functions around other functions', function () {
    var obj, mixin, receivedArg, context, fooFn, ret;

    fooFn = function (arg) {
      context = this;     // save the context
      receivedArg = arg;  // save the argument passed in
      return arg + 1;
    };

    obj = {
      foo: fooFn
    };

    mixin = new Mixin({
      around: {
        foo: function (fn, arg) {
          expect(fn).to.be.a('function'); // The first argument should be the original function
          var fooRet = fn(arg + 1); // note that no context is being passed to the fn
          return fooRet + 1;
        }
      }
    });

    mixin.applyTo(obj);

    ret = obj.foo(1);

    expect(context).to.be(obj);   // The object function should have received the correct context
    expect(receivedArg).to.be(2); // The function should have received a modified argument
    expect(ret).to.be(4);         // The modifier should have modified the return value
  });

  it('Arounds are applied after befores/afters', function () {
    var obj, mixin, fooOrder = [];
    obj = {
      foo: function () {
        fooOrder.push('main');
      }
    };

    mixin = new Mixin({
      around: {
        foo: function (fn) {
          fooOrder.push('arounda');
          fn();
          fooOrder.push('aroundb');
        }
      },
      before: {
        foo: function () {
          fooOrder.push('before');
        }
      },
      after: {
        foo: function () {
          fooOrder.push('after');
        }
      }
    });

    mixin.applyTo(obj);

    obj.foo();

    // The around function should be applied after the befores and afters
    expect(fooOrder).to.eql(['arounda', 'before', 'main', 'after', 'aroundb']);
  });

  it('can apply multiple modifiers', function () {
    var obj, mixin1, mixin2, fooOrder = [];

    obj = {
      foo: function () {
        fooOrder.push('main');
      }
    };

    mixin1 = new Mixin({
      before: {
        foo: function () {
          fooOrder.push('before1');
        }
      },
      after: {
        foo: function () {
          fooOrder.push('after1');
        }
      },
      around: {
        foo: function (fn) {
          fooOrder.push('around1a');
          fn();
          fooOrder.push('around1b');
        }
      }
    });
    mixin2 = new Mixin({
      before: {
        foo: function () {
          fooOrder.push('before2');
        }
      },
      after: {
        foo: function () {
          fooOrder.push('after2');
        }
      },
      around: {
        foo: function (fn) {
          fooOrder.push('around2a');
          fn();
          fooOrder.push('around2b');
        }
      }
    });

    mixin1.applyTo(obj);
    mixin2.applyTo(obj);

    obj.foo();

    expect(fooOrder).to.eql(
      ['around2a', 'before2', 'around1a', 'before1', 'main', 'after1', 'around1b', 'after2', 'around2b']
    );
  });

  it('can override properties if explicitly stated', function () {
    var obj, mixin;

    obj = {
      someProp: 'original',
      someFunc: function () {
        return 'original';
      }
    };

    mixin = new Mixin({
      override: {
        someProp: 'modified',
        someFunc: function () {
          return 'modified';
        }
      }
    });

    mixin.applyTo(obj);

    expect(obj.someProp).to.be('modified');   // The property should have been overridden
    expect(obj.someFunc()).to.be('modified'); // The method should have been overridden
  });

  it('can define default values', function () {
    var mixin, obj;
    function Cls() {}
    function SubCls() {}

    Cls.prototype = {
      foo: function () {
        return 'super foo';
      },
      bar: function () {
        return 'super bar';
      }
    };
    SubCls.prototype = Object.create(Cls.prototype);

    SubCls.prototype.foo = function () {
      return 'sub foo';
    };

    mixin = new Mixin({
      defaults: {
        foo: function () {
          return 'mixin foo';
        },
        bar: function () {
          return 'mixin bar';
        },
        baz: function () {
          return 'mixin baz';
        }
      }
    });

    mixin.applyTo(SubCls.prototype);

    obj = new SubCls();

    expect(obj.foo()).to.be('sub foo'); // foo was defined on the subclass so it should not have been overwritten
    expect(obj.bar()).to.be('super bar'); // bar was defined on the superclass so it should have been overwritten
    expect(obj.baz()).to.be('mixin baz'); // baz was not defined at all, so it should have been applied
  });

  it('can merge objects', function () {
    var mixin, obj;

    obj = {
      defaults: {},
      events: {
        'click': 'onClick'
      }
    };

    mixin = new Mixin({
      merge: {
        defaults: {
          'title': 'foo'
        },
        events: {
          'click': 'mixinOnClick',
          'mouseover': 'onMouseover'
        },
        element2selector: {
          'link': 'a'
        }
      }
    });
    mixin.applyTo(obj);

    // Existing objects should be merged
    expect(obj.defaults).to.eql({ 'title': 'foo' });

    // New keys should be added, and existing keys should not be overridden
    expect(obj.events).to.eql({ 'click': 'onClick', 'mouseover': 'onMouseover' });

    // New properties should be created
    expect(obj.element2selector).to.eql({ 'link': 'a' });
  });

  it('can merge arrays', function () {
    var mixin, obj;

    obj = {
      css: ['button.css'],
      requiredAttributes: [],
      observedAttributes: {
        sound: ['title'],
        playlist: ['tracks']
      }
    };
    mixin = new Mixin({
      merge: {
        css: ['colors.css', 'button.css'],
        requiredAttributes: ['purchase_url'],
        observedAttributes: {
          sound: ['artwork_url']
        },
        myList: ['foo', 'bar']
      }
    });

    mixin.applyTo(obj);

    // Existing arrays are extended
    expect(obj.requiredAttributes).to.eql(['purchase_url']);

    // Only unique values are added to the target
    expect(obj.css).to.eql(['button.css', 'colors.css']);

    // Extension is only shallow
    expect(obj.observedAttributes.sound).to.eql(['title']);

    // New properties are added to the target
    expect(obj.myList).to.eql(['foo', 'bar']);
  });

  it('will lift values into an array for merge', function () {
    var obj, mixin;
    obj = {
      css: 'buttons.css'
    };
    mixin = new Mixin({
      merge: {
        css: ['colors.css']
      }
    });
    mixin.applyTo(obj);
    expect(obj.css).to.eql(['buttons.css', 'colors.css']);
  });

  it('will merge strings as a token list', function () {
    var mixin, obj;
    mixin = new Mixin({
      merge: {
        'className': 'sc-button',
        'foo': 'bar baz',
        'quux': 'fuzbar'
      }
    });

    obj = {
      'className': 'myView',
      'foo': 'baz'
    };

    mixin.applyTo(obj);

    // Existing strings are extended with spaces
    expect(obj.className).to.be('myView sc-button');

    // Only unique tokens should be added
    expect(obj.foo).to.be('baz bar');

    // New properties should be added
    expect(obj.quux).to.be('fuzbar');
  });

  it('ignore nullish values in merge', function () {
    var mixin, obj;

    mixin = new Mixin({
      merge: {
        nullVal: null,
        undefVal: undefined
      }
    });
    obj = {};

    mixin.applyTo(obj);
    expect(obj).not.to.have.property('nullVal');
    expect(obj).not.to.have.property('undefVal');
  });

  it('won\'t affect prototype objects when merging', function () {
    // this checks that the target object is not mutated when using merge; rather, a new object is returned
    var mixin, obj, obj2;

    function MyClass() {}
    MyClass.prototype.foo = { a: 1 };
    MyClass.prototype.bar = [ 1 ];

    obj = new MyClass();
    mixin = new Mixin({
      merge: {
        foo: { a: 2, b: 2 },
        bar: [ 2 ]
      }
    });

    mixin.applyTo(obj);
    expect(obj.foo).to.eql({ a: 1, b: 2});
    expect(obj.bar).to.eql([1, 2]);

    obj2 = new MyClass();
    expect(obj2.foo).to.eql({ a: 1 });
    expect(obj2.bar).to.eql([1]);
  });

  it('Custom applyTo exposes its interface', function () {
    var mixin, obj = {}, ranExpectations = false;

    mixin = new Mixin({
      applyTo: function (o) {
        expect(o).to.be(obj); // The object should have been passed through
        expect(this.before)  .to.be.a('function');
        expect(this.after)   .to.be.a('function');
        expect(this.around)  .to.be.a('function');
        expect(this.override).to.be.a('function');
        expect(this.extend)  .to.be.a('function');
        expect(this.requires).to.be.a('function');
        expect(this.defaults).to.be.a('function');
        expect(this.merge)   .to.be.a('function');
        ranExpectations = true;
      }
    });
    mixin.applyTo(obj);
    expect(ranExpectations).to.be(true);
  });

  it('Custom applyTo can be mixed with shortcut methods', function () {
    var mixin, obj, afterFoo = false;

    obj = {
      foo: function () {}
    };

    mixin = new Mixin({
      after: {
        foo: function () {
          afterFoo = true;
        }
      },
      applyTo: function (o, options) {
        this.extend(o, {
          size: 1,
          zoom: function () {
            this.size *= options.zoomLevel;
          }
        });
      }
    });

    mixin.applyTo(obj, { zoomLevel: 5 });

    expect(obj.size).to.be(1); // The property should have been applied

    obj.zoom();

    expect(obj.size).to.be(5); // A custom zoom method should have been applied

    obj.foo();

    expect(afterFoo).to.be(true); // The after should have been applied
  });

  it('can be curried with options for shorthand syntax', function () {
    var mix, curriedMixin, obj;

    mix = new Mixin({
      applyTo: function (target, options) {
        target.foo = options.foo;
      }
    });

    curriedMixin = mix.withOptions({ foo: 'bar' });
    expect(curriedMixin).to.be.a(Mixin); // The curried mixin is also an instance of Mixin class

    obj = {};
    curriedMixin.applyTo(obj);

    expect(obj.foo).to.be('bar'); // The mixin should have been applied with the curried options
  });

  ///////////////////////////////////////////////////////////////////////////////

  describe('error checking', function () {
    function applyMixinWithMergeValue(val, obj) {
      obj = obj || {};
      return function () {
        var mixin = new Mixin({
              merge: {
                key: val
              }
            });
        mixin.applyTo(obj);
      };
    }

    it('enforces applying modifiers only to functions', function () {
      var mixin, noBefore, noAfter, noAround, noop = function () {};

      // mixin which defines all three modifiers
      mixin = new Mixin({
        before: { foo: noop },
        after : { bar: noop },
        around: { baz: noop }
      });

      // three object, each missing one required property
      noBefore = {
        bar: noop,
        baz: noop
      };
      noAfter = {
        foo: noop,
        bar: 1, // exists, not a function though
        baz: noop
      };
      noAround = {
        foo: noop,
        bar: noop,
        baz: /abc/
      };

      // The before method should be required
      expect(mixin.applyTo.bind(mixin, noBefore)).to.throwError(/Object is missing function property "foo"/);
      // The after method should be required
      expect(mixin.applyTo.bind(mixin, noAfter)).to.throwError(/Object is missing function property "bar"/);
      // The around method should be required
      expect(mixin.applyTo.bind(mixin, noAround)).to.throwError(/Object is missing function property "baz"/);
    });

    it('disallows overriding existing properties', function () {
      var obj, hasFoo;
      obj = {
        foo: 'FOO'
      };

      hasFoo = new Mixin({
        foo: 'fuuuuuu'
      });

      // Mixins should not override existing properties
      expect(hasFoo.applyTo.bind(hasFoo, obj)).to.throwError(/Mixin overrides existing property "foo"/);
    });

    it('disallows overriding existing properties defined in the prototype', function () {

      var Cls, obj, mixin;
      Cls = function () {};
      Cls.prototype.foo = 'FOO';

      obj = new Cls();

      mixin = new Mixin({
        foo: 'fuuuuuuuu'
      });

      // Mixins should not override properties even of the prototype
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/Mixin overrides existing property "foo"/);

    });

    it('enforces required properties', function () {
      var obj, mixin;

      obj = {
        foo: 1
      };

      mixin = new Mixin({
        requires: ['foo', 'bar']
      });

      // Mixins should be able to define required properties
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/Object is missing required properties: "bar"/);
    });

    it('warns about all missing required properties', function () {
      var obj, mixin;

      obj = {};

      mixin = new Mixin({
        requires: ['foo', 'bar']
      });

      // Mixins should report all missing required properties
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/Object is missing required properties: "foo", "bar"/);
    });

    it('checks that requires must be an array', function () {
      var obj, mixin;

      obj = {};
      mixin = new Mixin({
        requires: 'foo'
      });

      // requires must be an array
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/requires should be an array of required property names/);
    });

    it('can enforce a required prototype', function () {
      var Animal = function () {},
          Dog    = function () {},
          Beagle = function () {},
          Car    = function () {},
          Life;

      Dog.prototype = Object.create(Animal.prototype);
      Beagle.prototype = Object.create(Dog.prototype);

      Life = new Mixin({
        requirePrototype: Animal.prototype
      });

      // Mixins should be able to define required prototype
      expect(Life.applyTo.bind(Life, Car.prototype)).to.throwError(/Object is not inherited from required prototype/);

      // Required prototype can be exact class
      expect(Life.applyTo.bind(Life, Animal.prototype)).to.not.throwError();

      // Required prototype can be parent class
      expect(Life.applyTo.bind(Life, Dog.prototype)).to.not.throwError();

      // Required prototype can be any ancestor class
      expect(Life.applyTo.bind(Life, Beagle.prototype)).to.not.throwError();
    });

    it('enforces that requirePrototype be an object', function () {
      expect(function () {
        var myMixin = new Mixin({
          requirePrototype: 'abc'
        });
        myMixin.applyTo({});
      }).to.throwError(/requirePrototype should be an object/);
    });

    it('will reject non-array and non-object properties from `merge`', function () {
      expect(applyMixinWithMergeValue(1)).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(/abc/)).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(new Date())).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(function () {})).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(false)).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(null)).to.not.throwError();
      expect(applyMixinWithMergeValue(undefined)).to.not.throwError();
    });
  });

  describe('when combining mixins', function () {
    it('can be combine two mixins', function () {
      var M1, M2, object;

      M1 = new Mixin({
        propertyA: 'a'
      });
      M2 = new Mixin(M1, {
        propertyB: 'b'
      });

      object = {};

      M2.applyTo(object);

      expect(object).to.eql({ propertyA: 'a', propertyB: 'b' });
    });

    it('applies around, before, after modifiers to the target object', function () {
      var M1, M2, object, output = [];

      M1 = new Mixin(createMixinConfig('m1', 'foo', output));
      M2 = new Mixin(M1, createMixinConfig('m2', 'foo', output));

      object = {
        foo: function (arg) {
          output.push('obj-foo ' + arg);
        }
      };

      M2.applyTo(object);
      object.foo('bar');
      expect(output).to.eql([
        'm2-around-foo-before bar',
        'm2-before-foo bar',
        'm1-around-foo-before bar',
        'm1-before-foo bar',
        'obj-foo bar',
        'm1-after-foo bar',
        'm1-around-foo-after bar',
        'm2-after-foo bar',
        'm2-around-foo-after bar'
      ]);
    });

    it('copies properties prior to executing modifiers', function () {
      var M1, M2, object = {}, output = [];

      M1 = new Mixin(createMixinConfig('m1', 'foo', output));
      M2 = new Mixin(M1, createMixinConfig('m2', 'foo', output));
      M2.properties.foo = function (arg) {
        output.push('m2-foo ' + arg);
      };

      M2.applyTo(object);
      object.foo('bar');
      expect(output).to.eql([
        'm2-around-foo-before bar',
        'm2-before-foo bar',
        'm1-around-foo-before bar',
        'm1-before-foo bar',
        'm2-foo bar',
        'm1-after-foo bar',
        'm1-around-foo-after bar',
        'm2-after-foo bar',
        'm2-around-foo-after bar'
      ]);

      output = [];
      object = {};
      M1 = new Mixin(createMixinConfig('m1', 'foo', output));
      M2 = new Mixin(M1, createMixinConfig('m2', 'foo', output));
      M1.properties.foo = function (arg) {
        output.push('m1-foo ' + arg);
      };

      M2.applyTo(object);
      object.foo('bar');
      expect(output).to.eql([
        'm2-around-foo-before bar',
        'm2-before-foo bar',
        'm1-around-foo-before bar',
        'm1-before-foo bar',
        'm1-foo bar',
        'm1-after-foo bar',
        'm1-around-foo-after bar',
        'm2-after-foo bar',
        'm2-around-foo-after bar'
      ]);
    });

    it('applies defaults and override modifiers to the target object', function () {
      var M1, M2, object;

      M1 = new Mixin({
        defaults: {
          foo: 'm1-default'
        },
        override: {
          bar: 'm1-override'
        }
      });

      M2 = new Mixin(M1, {
        defaults: {
          foo: 'm2-default'
        },
        override: {
          bar: 'm2-override'
        }
      });

      object = {};

      M2.applyTo(object);

      expect(object.foo).to.be('m2-default');
      expect(object.bar).to.be('m2-override');
    });

    it('applies requires modifiers to the target object', function () {
      var M1, M2, object;

      M1 = new Mixin({});
      M2 = new Mixin(M1, {
        requires: ['bazM2']
      });

      object = {};

      expect(M2.applyTo.bind(M2, object)).to.throwError(/Object is missing required properties: "bazM2"/);

      M1.properties.requires = ['bazM1'];

      expect(M2.applyTo.bind(M2, object)).to.throwError(/Object is missing required properties: "bazM1"/);
    });

    it('allows required properties can be defined in other mixins', function () {
      var M1, M2, object;

      M1 = new Mixin({
        foo: function () {}
      });

      M2 = new Mixin(M1, {
        requires: ['foo']
      });

      object = {};
      expect(M2.applyTo.bind(M2, object)).not.to.throwError();

      M1 = new Mixin({
        requires: ['foo']
      });

      M2 = new Mixin(M1, {
        foo: function () {}
      });

      object = {};
      expect(M2.applyTo.bind(M2, object)).not.to.throwError();
    });

    it('will take the last mixin\'s override instead of the others', function () {
      var M1, M2, object, output = [];

      M1 = new Mixin({
        override: {
          foo: function (arg) {
            output.push('m1 ' + arg);
          }
        }
      });

      M2 = new Mixin(M1, {
        override: {
          foo: function (arg) {
            output.push('m2 ' + arg);
          }
        }
      });

      object = {
        foo: function (arg) {
          output.push('obj ' + arg);
        }
      };

      M2.applyTo(object);

      object.foo('bar');

      expect(output).to.eql(['m2 bar']);
    });

    it('can combine already-combined mixins', function () {
      var M1, M2, M3, object;

      M1 = new Mixin({
        propertyA: 'a'
      });
      M2 = new Mixin(M1, {
        propertyB: 'b'
      });
      M3 = new Mixin(M2, {
        propertyC: 'c'
      });

      object = {};

      M3.applyTo(object);

      expect(object.propertyA).to.be('a');
      expect(object.propertyB).to.be('b');
      expect(object.propertyC).to.be('c');
    });

    it('can combine multiple mixins', function () {
      var M1, M2, M3, object;

      M1 = new Mixin({
        propertyA: 'a'
      });
      M2 = new Mixin({
        propertyB: 'b'
      });
      M3 = new Mixin(M1, M2, {
        propertyC: 'c'
      });

      object = {};

      M3.applyTo(object);

      expect(object.propertyA).to.be('a');
      expect(object.propertyB).to.be('b');
      expect(object.propertyC).to.be('c');
    });
  });
});

/**
 * @param {String} mixinName
 * @param {String} functionName
 * @param {Array}  output
 */
function createMixinConfig(mixinName, functionName, output) {
  var config = {
    before : {},
    after  : {},
    around : {}
  };

  config.before[functionName] = function (arg) {
    output.push(mixinName + '-before-foo ' + arg);
  };

  config.after[functionName] = function (arg) {
    output.push(mixinName + '-after-foo ' + arg);
  };

  config.around[functionName] = function (fn, arg) {
    output.push(mixinName + '-around-foo-before ' + arg);
    fn(arg);
    output.push(mixinName + '-around-foo-after ' + arg);
  };

  return config;
}
