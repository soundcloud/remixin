/*!
 * Remixin v1.0.1
 * (c) SoundCloud 2015
 * Remixin may be freely distributed under the MIT license.
 */
!function(t){var n=t(require("underscore"));module.exports=n}(function(t){function n(){this.mixins=t.initial(arguments),this.properties=t.last(arguments)}function e(t,n){this.applyTo=function(e){t.applyTo(e,n)}}function r(t,n){return null==t?n.slice():i(s(t),n)}function i(n,e){return n.concat(t.difference(e,n))}function o(t,n){return null==t?n:r(a(t),a(n)).join(" ")}function u(n,e){return t.extend({},e,n)}function a(n){return t.compact(n.split(p))}function s(n){return t.isArray(n)?n:[n]}var f=["before","after","around","requires","override","defaults","applyTo","requirePrototype","merge"],p=/\s+/;return t.extend(n.prototype,{applyTo:function(n,e){var r=this.properties;this.defaults(n,r.defaults),this.extend(n,r),this.merge(n,r.merge),t.invoke(this.mixins,"applyTo",n),["requires","requirePrototype","override","before","after","around"].forEach(function(t){this[t](n,r[t])},this),r.applyTo&&r.applyTo.call(this,n,e)},withOptions:function(t){return new e(this,t)},before:function(n,e){t.each(e,function(t,e){var r=n[e];n[e]=function(){return t.apply(this,arguments),r.apply(this,arguments)}})},after:function(n,e){t.each(e,function(t,e){var r=n[e];n[e]=function(){var n=r.apply(this,arguments);return t.apply(this,arguments),n}})},around:function(n,e){t.each(e,function(t,e){var r=n[e];n[e]=function(){var n=0,e=arguments.length,i=Array(e+1);for(i[0]=r.bind(this);e>n;++n)i[n+1]=arguments[n];return t.apply(this,i)}})},override:function(n,e){t.extend(n,e)},defaults:function(n,e){t.defaults(n,e)},merge:function(n,e){t.each(e,function(e,i){if(null!=e){var a=n[i];n[i]=t.isArray(e)?r(a,e):t.isString(e)?o(a,e):u(a,e)}})},extend:function(n,e){var r=t.omit(e,f);t.extend(n,r)},requires:t.noop,requirePrototype:t.noop}),e.prototype=n.prototype,n});