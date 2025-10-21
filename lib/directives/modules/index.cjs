/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:09 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var clickOutside = require('./click-outside.cjs');
var copy = require('./copy.cjs');
var debounce = require('./debounce.cjs');
var drag = require('./drag.cjs');
var infiniteScroll = require('./infinite-scroll.cjs');
var lazy = require('./lazy.cjs');
var loading = require('./loading.cjs');
var resize = require('./resize.cjs');
var throttle = require('./throttle.cjs');
var tooltip = require('./tooltip.cjs');

const directives = {
  "click-outside": clickOutside.vClickOutside,
  "copy": copy.vCopy,
  "debounce": debounce.vDebounce,
  "drag": drag.vDrag,
  "infinite-scroll": infiniteScroll.vInfiniteScroll,
  "lazy": lazy.vLazy,
  "loading": loading.vLoading,
  "resize": resize.vResize,
  "throttle": throttle.vThrottle,
  "tooltip": tooltip.vTooltip
};
const directiveInstances = [
  new clickOutside.ClickOutsideDirective(),
  new copy.CopyDirective(),
  new debounce.DebounceDirective(),
  new drag.DragDirective(),
  new infiniteScroll.InfiniteScrollDirective(),
  new lazy.LazyDirective(),
  new loading.LoadingDirective(),
  new resize.ResizeDirective(),
  new throttle.ThrottleDirective(),
  new tooltip.TooltipDirective()
];
const vueDirectives = directives;

exports.ClickOutsideDirective = clickOutside.ClickOutsideDirective;
exports.vClickOutside = clickOutside.vClickOutside;
exports.CopyDirective = copy.CopyDirective;
exports.vCopy = copy.vCopy;
exports.DebounceDirective = debounce.DebounceDirective;
exports.vDebounce = debounce.vDebounce;
exports.DragDirective = drag.DragDirective;
exports.vDrag = drag.vDrag;
exports.InfiniteScrollDirective = infiniteScroll.InfiniteScrollDirective;
exports.vInfiniteScroll = infiniteScroll.vInfiniteScroll;
exports.LazyDirective = lazy.LazyDirective;
exports.vLazy = lazy.vLazy;
exports.LoadingDirective = loading.LoadingDirective;
exports.vLoading = loading.vLoading;
exports.ResizeDirective = resize.ResizeDirective;
exports.vResize = resize.vResize;
exports.ThrottleDirective = throttle.ThrottleDirective;
exports.vThrottle = throttle.vThrottle;
exports.TooltipDirective = tooltip.TooltipDirective;
exports.vTooltip = tooltip.vTooltip;
exports.default = directives;
exports.directiveInstances = directiveInstances;
exports.directives = directives;
exports.vueDirectives = vueDirectives;
//# sourceMappingURL=index.cjs.map
