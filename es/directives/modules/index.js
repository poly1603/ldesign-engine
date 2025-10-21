/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { ClickOutsideDirective, vClickOutside } from './click-outside.js';
import { CopyDirective, vCopy } from './copy.js';
import { DebounceDirective, vDebounce } from './debounce.js';
import { DragDirective, vDrag } from './drag.js';
import { InfiniteScrollDirective, vInfiniteScroll } from './infinite-scroll.js';
import { LazyDirective, vLazy } from './lazy.js';
import { LoadingDirective, vLoading } from './loading.js';
import { ResizeDirective, vResize } from './resize.js';
import { ThrottleDirective, vThrottle } from './throttle.js';
import { TooltipDirective, vTooltip } from './tooltip.js';

const directives = {
  "click-outside": vClickOutside,
  "copy": vCopy,
  "debounce": vDebounce,
  "drag": vDrag,
  "infinite-scroll": vInfiniteScroll,
  "lazy": vLazy,
  "loading": vLoading,
  "resize": vResize,
  "throttle": vThrottle,
  "tooltip": vTooltip
};
const directiveInstances = [
  new ClickOutsideDirective(),
  new CopyDirective(),
  new DebounceDirective(),
  new DragDirective(),
  new InfiniteScrollDirective(),
  new LazyDirective(),
  new LoadingDirective(),
  new ResizeDirective(),
  new ThrottleDirective(),
  new TooltipDirective()
];
const vueDirectives = directives;

export { ClickOutsideDirective, CopyDirective, DebounceDirective, DragDirective, InfiniteScrollDirective, LazyDirective, LoadingDirective, ResizeDirective, ThrottleDirective, TooltipDirective, directives as default, directiveInstances, directives, vClickOutside, vCopy, vDebounce, vDrag, vInfiniteScroll, vLazy, vLoading, vResize, vThrottle, vTooltip, vueDirectives };
//# sourceMappingURL=index.js.map
