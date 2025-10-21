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

var index$1 = require('./modules/index.cjs');
var directiveBase = require('./base/directive-base.cjs');
var vueDirectiveAdapter = require('./base/vue-directive-adapter.cjs');
var directiveManager = require('./directive-manager.cjs');
var clickOutside = require('./modules/click-outside.cjs');
var copy = require('./modules/copy.cjs');
var debounce = require('./modules/debounce.cjs');
var drag = require('./modules/drag.cjs');
var infiniteScroll = require('./modules/infinite-scroll.cjs');
var lazy = require('./modules/lazy.cjs');
var loading = require('./modules/loading.cjs');
var resize = require('./modules/resize.cjs');
var throttle = require('./modules/throttle.cjs');
var tooltip = require('./modules/tooltip.cjs');

function createModernDirectiveManager(_config) {
  return null;
}
function getAllDirectiveInstances() {
  return index$1.directiveInstances;
}
function getAllVueDirectives() {
  return index$1.vueDirectives;
}
var index = null;

exports.directiveInstances = index$1.directiveInstances;
exports.directives = index$1.directives;
exports.vueDirectives = index$1.vueDirectives;
exports.DirectiveBase = directiveBase.DirectiveBase;
exports.createVueDirective = vueDirectiveAdapter.createVueDirective;
exports.defineDirective = vueDirectiveAdapter.defineDirective;
exports.directiveUtils = vueDirectiveAdapter.directiveUtils;
exports.DirectiveManagerImpl = directiveManager.DirectiveManagerImpl;
exports.commonDirectives = directiveManager.commonDirectives;
exports.createDirectiveManager = directiveManager.createDirectiveManager;
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
exports.createModernDirectiveManager = createModernDirectiveManager;
exports.default = index;
exports.getAllDirectiveInstances = getAllDirectiveInstances;
exports.getAllVueDirectives = getAllVueDirectives;
//# sourceMappingURL=index.cjs.map
