/*!
 * Remixin v1.0.3
 * (c) SoundCloud 2015
 * Remixin may be freely distributed under the MIT license.
 */
!function(r){var t=r(require("underscore"));module.exports=t}(function(r){function t(){this.mixins=r.initial(arguments),this.properties=r.last(arguments)}function n(r,t){this.applyTo=function(n){r.applyTo(n,t)}}function e(r,t,n){switch(n.length){case 0:return r.call(t);case 1:return r.call(t,n[0]);case 2:return r.call(t,n[0],n[1]);case 3:return r.call(t,n[0],n[1],n[2]);case 4:return r.call(t,n[0],n[1],n[2],n[3]);default:return r.apply(t,n)}}function i(r,t){return null==r?t.slice():o(c(r),t)}function o(t,n){return t.concat(r.difference(n,t))}function u(r,t){return null==r?t:i(s(r),s(t)).join(" ")}function a(t,n){return r.extend({},n,t)}function s(t){return r.compact(t.split(l))}function c(t){return r.isArray(t)?t:[t]}var f=["before","after","around","requires","override","defaults","applyTo","requirePrototype","merge"],l=/\s+/;return r.extend(t.prototype,{applyTo:function(t,n){var e=this.properties;this.defaults(t,e.defaults),this.extend(t,e),this.merge(t,e.merge),r.invoke(this.mixins,"applyTo",t),["requires","requirePrototype","override","before","after","around"].forEach(function(r){this[r](t,e[r])},this),e.applyTo&&e.applyTo.call(this,t,n)},withOptions:function(r){return new n(this,r)},before:function(t,n){r.each(n,function(r,n){var i=t[n];t[n]=function(){for(var t=Array(arguments.length),n=0;n<arguments.length;++n)t[n]=arguments[n];return e(r,this,t),e(i,this,t)}})},after:function(t,n){r.each(n,function(r,n){var i=t[n];t[n]=function(){for(var t=Array(arguments.length),n=0;n<arguments.length;++n)t[n]=arguments[n];var o=e(i,this,t);return e(r,this,t),o}})},around:function(t,n){r.each(n,function(r,n){var i=t[n];t[n]=function(){var t=arguments.length,n=Array(t+1);n[0]=i.bind(this);for(var o=0;t>o;++o)n[o+1]=arguments[o];return e(r,this,n)}})},override:function(t,n){r.extend(t,n)},defaults:function(t,n){r.each(n,function(r,n){t.hasOwnProperty(n)||(t[n]=r)})},merge:function(t,n){r.each(n,function(n,e){if(null!=n){var o=t[e];t[e]=r.isArray(n)?i(o,n):r.isString(n)?u(o,n):a(o,n)}})},extend:function(t,n){var e=r.omit(n,f);r.extend(t,e)},requires:r.noop,requirePrototype:r.noop}),n.prototype=t.prototype,t});