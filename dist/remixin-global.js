/*!
 * Remixin v1.0.3
 * (c) SoundCloud 2015
 * Remixin may be freely distributed under the MIT license.
 */
!function(n){var t,r=this,e=n;t=r.Remixin,r.Remixin=e,e.noConflict=function(){return r.Remixin=t,e}}(function(n){function t(){this.mixins=n.initial(arguments),this.properties=n.last(arguments)}function r(n,t){this.applyTo=function(r){n.applyTo(r,t)}}function e(n,t,r){switch(r.length){case 0:return n.call(t);case 1:return n.call(t,r[0]);case 2:return n.call(t,r[0],r[1]);case 3:return n.call(t,r[0],r[1],r[2]);case 4:return n.call(t,r[0],r[1],r[2],r[3]);default:return n.apply(t,r)}}function i(n,t){return null==n?t.slice():o(s(n),t)}function o(t,r){return t.concat(n.difference(r,t))}function u(n,t){return null==n?t:i(c(n),c(t)).join(" ")}function a(t,r){return n.extend({},r,t)}function c(t){return n.compact(t.split(l))}function s(t){return n.isArray(t)?t:[t]}var f=["before","after","around","requires","override","defaults","applyTo","requirePrototype","merge"],l=/\s+/;return n.extend(t.prototype,{applyTo:function(t,r){var e=this.properties;this.defaults(t,e.defaults),this.extend(t,e),this.merge(t,e.merge),n.invoke(this.mixins,"applyTo",t),["requires","requirePrototype","override","before","after","around"].forEach(function(n){this[n](t,e[n])},this),e.applyTo&&e.applyTo.call(this,t,r)},withOptions:function(n){return new r(this,n)},before:function(t,r){n.each(r,function(n,r){var i=t[r];t[r]=function(){for(var t=Array(arguments.length),r=0;r<arguments.length;++r)t[r]=arguments[r];return e(n,this,t),e(i,this,t)}})},after:function(t,r){n.each(r,function(n,r){var i=t[r];t[r]=function(){for(var t=Array(arguments.length),r=0;r<arguments.length;++r)t[r]=arguments[r];var o=e(i,this,t);return e(n,this,t),o}})},around:function(t,r){n.each(r,function(n,r){var i=t[r];t[r]=function(){var t=arguments.length,r=Array(t+1);r[0]=i.bind(this);for(var o=0;t>o;++o)r[o+1]=arguments[o];return e(n,this,r)}})},override:function(t,r){n.extend(t,r)},defaults:function(t,r){n.each(r,function(n,r){t.hasOwnProperty(r)||(t[r]=n)})},merge:function(t,r){n.each(r,function(r,e){if(null!=r){var o=t[e];t[e]=n.isArray(r)?i(o,r):n.isString(r)?u(o,r):a(o,r)}})},extend:function(t,r){var e=n.omit(r,f);n.extend(t,e)},requires:n.noop,requirePrototype:n.noop}),r.prototype=t.prototype,t});