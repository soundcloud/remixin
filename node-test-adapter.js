/* globals global: true */
// Put these into global scope so that the interface is the same
// as with the browser, and tests.js can be executed in both contexts
global.MixinProduction = require('./index');
global.MixinDebug = require('./remixin-dev-cjs');
global.expect = require('expect.js');
