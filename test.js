import expect from 'expect.js';
import _ from 'underscore';
import { Mixin } from './src/remixin';

Mixin.debug = true;

describe('Remixin', () => {
  it('can be applied to objects', () => {
    const obj = {
      foo: 'FOO'
    };

    const hasBaz = new Mixin({
      bar: _.noop,
      baz: 'BAZ'
    });

    hasBaz.applyTo(obj);

    expect(obj.baz).to.be('BAZ');  // The mixin should have added the new property
    expect(obj.bar).to.be(_.noop); // The mixin should have added the new method
    expect(obj.foo).to.be('FOO');  // The mixin should not have modified the old property
  });

  it('are able to define before/after method modifiers', () => {
    const fooOrder = [];

    const obj = {
      foo() {
        fooOrder.push('b');
      }
    };

    const mixin = new Mixin({
      before: {
        foo() {
          fooOrder.push('a');
        }
      },
      after: {
        foo() {
          fooOrder.push('c');
        }
      }
    });

    mixin.applyTo(obj);

    obj.foo();

    expect(fooOrder).to.eql(['a', 'b', 'c']);
  });

  it('does not allow befores/afters to modify arguments or return values', () => {
    const fooOrder = [];

    const obj = {
      foo(arg) {
        fooOrder.push(`b${arg}`);
        return arg;
      }
    };

    const mixin = new Mixin({
      before: {
        foo(arg) {
          fooOrder.push(`a${arg}`);
          return 'before';
        }
      },
      after: {
        foo(arg) {
          fooOrder.push(`c${arg}`);
          return 'after';
        }
      }
    });

    mixin.applyTo(obj);

    const ret = obj.foo(1);

    expect(fooOrder).to.eql(['a1', 'b1', 'c1']);  // The argument should have been passed to each modifier
    expect(ret).to.be(1);                         // The return values of the modifiers should have been ignored
  });

  it('can apply functions around other functions', () => {
    let receivedArg, context;

    const obj = {
      foo(arg) {
        context = this;     // save the context
        receivedArg = arg;  // save the argument passed in
        return arg + 1;
      }
    };

    const mixin = new Mixin({
      around: {
        foo(fn, arg) {
          expect(fn).to.be.a('function'); // The first argument should be the original function
          const fooRet = fn(arg + 1); // note that no context is being passed to the fn
          return fooRet + 1;
        }
      }
    });

    mixin.applyTo(obj);

    const ret = obj.foo(1);

    expect(context).to.be(obj);   // The object function should have received the correct context
    expect(receivedArg).to.be(2); // The function should have received a modified argument
    expect(ret).to.be(4);         // The modifier should have modified the return value
  });

  it('Arounds are applied after befores/afters', () => {
    const fooOrder = [];

    const obj = {
      foo() {
        fooOrder.push('main');
      }
    };

    const mixin = new Mixin({
      around: {
        foo(fn) {
          fooOrder.push('arounda');
          fn();
          fooOrder.push('aroundb');
        }
      },
      before: {
        foo() {
          fooOrder.push('before');
        }
      },
      after: {
        foo() {
          fooOrder.push('after');
        }
      }
    });

    mixin.applyTo(obj);

    obj.foo();

    // The around function should be applied after the befores and afters
    expect(fooOrder).to.eql(['arounda', 'before', 'main', 'after', 'aroundb']);
  });

  it('can apply multiple modifiers', () => {
    const fooOrder = [];

    const obj = {
      foo() {
        fooOrder.push('main');
      }
    };

    const mixin1 = new Mixin({
      before: {
        foo() {
          fooOrder.push('before1');
        }
      },
      after: {
        foo() {
          fooOrder.push('after1');
        }
      },
      around: {
        foo(fn) {
          fooOrder.push('around1a');
          fn();
          fooOrder.push('around1b');
        }
      }
    });

    const mixin2 = new Mixin({
      before: {
        foo() {
          fooOrder.push('before2');
        }
      },
      after: {
        foo() {
          fooOrder.push('after2');
        }
      },
      around: {
        foo(fn) {
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

  it('can override properties if explicitly stated', () => {
    const obj = {
      someProp: 'original',
      someFunc: () => 'original'
    };

    const mixin = new Mixin({
      override: {
        someProp: 'modified',
        someFunc: () => 'modified'
      }
    });

    mixin.applyTo(obj);

    expect(obj.someProp).to.be('modified');   // The property should have been overridden
    expect(obj.someFunc()).to.be('modified'); // The method should have been overridden
  });

  it('can merge objects', () => {
    const obj = {
      defaults: {},
      events: {
        'click': 'onClick'
      }
    };

    const mixin = new Mixin({
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

  it('can merge arrays', () => {
    const obj = {
      css: ['button.css'],
      requiredAttributes: [],
      observedAttributes: {
        sound: ['title'],
        playlist: ['tracks']
      }
    };

    const mixin = new Mixin({
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

  it('will lift values into an array for merge', () => {
    const obj = {
      css: 'buttons.css'
    };
    const mixin = new Mixin({
      merge: {
        css: ['colors.css']
      }
    });
    mixin.applyTo(obj);
    expect(obj.css).to.eql(['buttons.css', 'colors.css']);
  });

  it('will merge strings as a token list', () => {
    const mixin = new Mixin({
      merge: {
        'className': 'sc-button',
        'foo': 'bar baz',
        'quux': 'fuzbar'
      }
    });

    const obj = {
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

  it('ignore nullish values in merge', () => {
    const mixin = new Mixin({
      merge: {
        nullVal: null,
        undefVal: undefined
      }
    });
    const obj = {};

    mixin.applyTo(obj);
    expect(obj).not.to.have.property('nullVal');
    expect(obj).not.to.have.property('undefVal');
  });

  it(`won't affect prototype objects when merging`, () => {
    // this checks that the target object is not mutated when using merge; rather, a new object is returned

    class Cls {
      constructor() {
        this.foo = { a: 1 };
        this.bar = [ 1 ];
      }
    }

    const obj = new Cls();
    const mixin = new Mixin({
      merge: {
        foo: { a: 2, b: 2 },
        bar: [ 2 ]
      }
    });

    mixin.applyTo(obj);
    expect(obj.foo).to.eql({ a: 1, b: 2});
    expect(obj.bar).to.eql([1, 2]);

    const obj2 = new Cls();
    expect(obj2.foo).to.eql({ a: 1 });
    expect(obj2.bar).to.eql([1]);
  });

  it('Custom applyTo exposes its interface', () => {
    let ranExpectations = false;

    const obj = {};

    const mixin = new Mixin({
      applyTo(o) {
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

  it('Custom applyTo can be mixed with shortcut methods', () => {
    let afterFoo = false;

    const obj = {
      foo() {}
    };

    const mixin = new Mixin({
      after: {
        foo() {
          afterFoo = true;
        }
      },
      applyTo(o, options) {
        this.extend(o, {
          size: 1,
          zoom() {
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

  it('can be curried with options for shorthand syntax', () => {
    const mix = new Mixin({
      applyTo(target, options) {
        target.foo = options.foo;
      }
    });

    const curriedMixin = mix.withOptions({ foo: 'bar' });
    expect(curriedMixin).to.be.a(Mixin); // The curried mixin is also an instance of Mixin class

    const obj = {};
    curriedMixin.applyTo(obj);

    expect(obj.foo).to.be('bar'); // The mixin should have been applied with the curried options
  });

  ///////////////////////////////////////////////////////////////////////////////

  describe('error checking', () => {
    function applyMixinWithMergeValue(val, obj = {}) {
      return () => {
        const mixin = new Mixin({
          merge: {
            key: val
          }
        });
        mixin.applyTo(obj);
      };
    }

    it('enforces applying modifiers only to functions', () => {
      // mixin which defines all three modifiers
      const mixin = new Mixin({
        before: { foo() {} },
        after : { bar() {} },
        around: { baz() {} }
      });

      // three object, each missing one required property
      const noBefore = {
        bar() {},
        baz() {}
      };
      const noAfter = {
        foo() {},
        bar: 1, // exists, not a function though
        baz() {}
      };
      const noAround = {
        foo() {},
        bar() {},
        baz: /abc/
      };

      // The before method should be required
      expect(mixin.applyTo.bind(mixin, noBefore)).to.throwError(/Object is missing function property "foo"/);
      // The after method should be required
      expect(mixin.applyTo.bind(mixin, noAfter)).to.throwError(/Object is missing function property "bar"/);
      // The around method should be required
      expect(mixin.applyTo.bind(mixin, noAround)).to.throwError(/Object is missing function property "baz"/);
    });

    it('disallows overriding existing properties', () => {
      const obj = {
        foo: 'FOO'
      };

      const hasFoo = new Mixin({
        foo: 'fuuuuuu'
      });

      // Mixins should not override existing properties
      expect(hasFoo.applyTo.bind(hasFoo, obj)).to.throwError(/Mixin overrides existing property "foo"/);
    });

    it('disallows overriding existing properties defined in the prototype', () => {
      class Cls {
        constructor() {
          this.foo = 'FOO';
        }
      };

      const obj = new Cls();

      const mixin = new Mixin({
        foo: 'fuuuuuuuu'
      });

      // Mixins should not override properties even of the prototype
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/Mixin overrides existing property "foo"/);
    });

    it('enforces required properties', () => {
      const obj = {
        foo: 1
      };

      const mixin = new Mixin({
        requires: ['foo', 'bar']
      });

      // Mixins should be able to define required properties
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/Object is missing required properties: "bar"/);
    });

    it('warns about all missing required properties', () => {
      const obj = {};

      const mixin = new Mixin({
        requires: ['foo', 'bar']
      });

      // Mixins should report all missing required properties
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/Object is missing required properties: "foo", "bar"/);
    });

    it('checks that requires must be an array', () => {
      const obj = {};

      const mixin = new Mixin({
        requires: 'foo'
      });

      // requires must be an array
      expect(mixin.applyTo.bind(mixin, obj)).to.throwError(/requires should be an array of required property names/);
    });

    it('will allow for properties defined on the prototype', () => {
      const obj = {};

      const mixin = new Mixin({
        requires: ['toString']
      });

      expect(mixin.applyTo.bind(mixin, obj)).not.to.throwError();
    });

    it('can enforce a required prototype', () => {
      class Car {};
      class Animal {};
      class Dog extends Animal {};
      class Beagle extends Animal {};

      const Life = new Mixin({
        requirePrototype: Animal.prototype
      });

      // Mixins should be able to define required prototype
      expect(Life.applyTo.bind(Life, Car.prototype)).to.throwError(/Object does not inherit from required prototype/);

      // Required prototype can be exact class
      expect(Life.applyTo.bind(Life, Animal.prototype)).to.not.throwError();

      // Required prototype can be parent class
      expect(Life.applyTo.bind(Life, Dog.prototype)).to.not.throwError();

      // Required prototype can be any ancestor class
      expect(Life.applyTo.bind(Life, Beagle.prototype)).to.not.throwError();
    });

    it('enforces that requirePrototype be an object', () => {
      expect(() => {
        const myMixin = new Mixin({
          requirePrototype: 'abc'
        });
        myMixin.applyTo({});
      }).to.throwError(/requirePrototype should be an object/);
    });

    it('will reject non-array and non-object properties from `merge`', () => {
      expect(applyMixinWithMergeValue(1)).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(/abc/)).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(new Date())).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(_.noop)).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(false)).to.throwError(/Unsupported data type for merge/);
      expect(applyMixinWithMergeValue(null)).to.not.throwError();
      expect(applyMixinWithMergeValue(undefined)).to.not.throwError();
    });
  });

  describe('when combining mixins', () => {
    it('can be combine two mixins', () => {
      const M1 = new Mixin({
        propertyA: 'a'
      });

      const M2 = new Mixin(M1, {
        propertyB: 'b'
      });

      const obj = {};

      M2.applyTo(obj);

      expect(obj).to.eql({ propertyA: 'a', propertyB: 'b' });
    });

    it('applies around, before, after modifiers to the target object', () => {
      const output = [];

      const M1 = new Mixin(createMixinConfig('m1', 'foo', output));

      const M2 = new Mixin(M1, createMixinConfig('m2', 'foo', output));

      const obj = {
        foo(arg) {
          output.push(`obj-foo ${arg}`);
        }
      };

      M2.applyTo(obj);
      obj.foo('bar');
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

    it('copies properties prior to executing modifiers', () => {
      let output = [];
      let obj = {};
      let M1 = new Mixin(createMixinConfig('m1', 'foo', output));
      let M2 = new Mixin(M1, createMixinConfig('m2', 'foo', output));
      M2.properties.foo = (arg) => {
        output.push(`m2-foo ${arg}`);
      };

      M2.applyTo(obj);
      obj.foo('bar');
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
      obj = {};
      M1 = new Mixin(createMixinConfig('m1', 'foo', output));
      M2 = new Mixin(M1, createMixinConfig('m2', 'foo', output));
      M1.properties.foo = (arg) => {
        output.push(`m1-foo ${arg}`);
      };

      M2.applyTo(obj);
      obj.foo('bar');
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

    it('applies defaults and override modifiers to the target object', () => {
      const M1 = new Mixin({
        defaults: {
          foo: 'm1-default'
        },
        override: {
          bar: 'm1-override'
        }
      });

      const M2 = new Mixin(M1, {
        defaults: {
          foo: 'm2-default'
        },
        override: {
          bar: 'm2-override'
        }
      });

      const obj = {};

      M2.applyTo(obj);

      expect(obj.foo).to.be('m2-default');
      expect(obj.bar).to.be('m2-override');
    });

    it('will apply defaults to objects whose prototype defines that property', () => {
      class Cls {
        foo() {
          return 'super foo';
        }

        bar() {
          return 'super bar';
        }
      };

      const obj = new Cls();
      obj.foo = () => 'sub foo';

      const mixin = new Mixin({
        defaults: {
          foo: () => 'mixin foo',
          bar: () => 'mixin bar',
          baz: () => 'mixin baz'
        }
      });

      mixin.applyTo(obj);

      expect(obj.foo()).to.be('sub foo');   // foo was defined on the object so it should not have been overwritten
      expect(obj.bar()).to.be('mixin bar'); // bar was not defined on the object so it should have been overwritten
      expect(obj.baz()).to.be('mixin baz'); // baz was not defined at all, so it should have been applied
    });

    it('applies requires modifiers to the target object', () => {
      const M1 = new Mixin({});
      const M2 = new Mixin(M1, {
        requires: ['bazM2']
      });

      const obj = {};

      expect(M2.applyTo.bind(M2, obj)).to.throwError(/Object is missing required properties: "bazM2"/);

      M1.properties.requires = ['bazM1'];

      expect(M2.applyTo.bind(M2, obj)).to.throwError(/Object is missing required properties: "bazM1"/);
    });

    it('allows required properties can be defined in other mixins', () => {
      let M1 = new Mixin({
        foo() {}
      });

      let M2 = new Mixin(M1, {
        requires: ['foo']
      });

      let obj = {};
      expect(M2.applyTo.bind(M2, obj)).not.to.throwError();

      M1 = new Mixin({
        requires: ['foo']
      });

      M2 = new Mixin(M1, {
        foo() {}
      });

      obj = {};
      expect(M2.applyTo.bind(M2, obj)).not.to.throwError();
    });

    it('will take the last mixin\'s override instead of the others', () => {
      const output = [];

      const M1 = new Mixin({
        override: {
          foo(arg) {
            output.push(`m1 ${arg}`);
          }
        }
      });

      const M2 = new Mixin(M1, {
        override: {
          foo(arg) {
            output.push(`m2 ${arg}`);
          }
        }
      });

      const obj = {
        foo(arg) {
          output.push(`obj ${arg}`);
        }
      };

      M2.applyTo(obj);

      obj.foo('bar');

      expect(output).to.eql(['m2 bar']);
    });

    it('can combine already-combined mixins', () => {
      const M1 = new Mixin({
        propertyA: 'a'
      });
      const M2 = new Mixin(M1, {
        propertyB: 'b'
      });
      const M3 = new Mixin(M2, {
        propertyC: 'c'
      });

      const obj = {};

      M3.applyTo(obj);

      expect(obj.propertyA).to.be('a');
      expect(obj.propertyB).to.be('b');
      expect(obj.propertyC).to.be('c');
    });

    it('can combine multiple mixins', () => {
      const M1 = new Mixin({
        propertyA: 'a'
      });
      const M2 = new Mixin({
        propertyB: 'b'
      });
      const M3 = new Mixin(M1, M2, {
        propertyC: 'c'
      });

      const obj = {};

      M3.applyTo(obj);

      expect(obj.propertyA).to.be('a');
      expect(obj.propertyB).to.be('b');
      expect(obj.propertyC).to.be('c');
    });
  });
});

/**
 * @param {String} mixinName
 * @param {String} functionName
 * @param {Array}  output
 */
function createMixinConfig(mixinName, functionName, output) {
  return {
    before: {
      [functionName](arg) {
        output.push(`${mixinName}-before-foo ${arg}`);
      }
    },
    after: {
      [functionName](arg) {
        output.push(`${mixinName}-after-foo ${arg}`);
      }
    },
    around: {
      [functionName](fn, arg) {
        output.push(`${mixinName}-around-foo-before ${arg}`);
        fn(arg);
        output.push(`${mixinName}-around-foo-after ${arg}`);
      }
    }
  };
}
