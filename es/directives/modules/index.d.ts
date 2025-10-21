/**
 * 指令模块统一导出
 * 提供所有指令的统一入口
 */
import vClickOutside, { ClickOutsideDirective } from './click-outside';
import vCopy, { CopyDirective } from './copy';
import vDebounce, { DebounceDirective } from './debounce';
import vDrag, { DragDirective } from './drag';
import vInfiniteScroll, { InfiniteScrollDirective } from './infinite-scroll';
import vLazy, { LazyDirective } from './lazy';
import vLoading, { LoadingDirective } from './loading';
import vResize, { ResizeDirective } from './resize';
import vThrottle, { ThrottleDirective } from './throttle';
import vTooltip, { TooltipDirective } from './tooltip';
export { vClickOutside, vCopy, vDebounce, vDrag, vInfiniteScroll, vLazy, vLoading, vResize, vThrottle, vTooltip, };
export { ClickOutsideDirective, CopyDirective, DebounceDirective, DragDirective, InfiniteScrollDirective, LazyDirective, LoadingDirective, ResizeDirective, ThrottleDirective, TooltipDirective, };
export type { ClickOutsideOptions, } from './click-outside';
export type { CopyOptions, } from './copy';
export type { DebounceOptions, } from './debounce';
export type { DragConstraint, DragEvent, DragOptions, DragState, } from './drag';
export type { InfiniteScrollOptions, } from './infinite-scroll';
export type { LazyOptions, } from './lazy';
export type { LoadingOptions, } from './loading';
export type { ResizeOptions, } from './resize';
export type { ThrottleOptions, } from './throttle';
export type { TooltipOptions, } from './tooltip';
export declare const directives: {
    'click-outside': import("vue").Directive;
    copy: import("vue").Directive;
    debounce: import("vue").Directive;
    drag: import("vue").Directive;
    'infinite-scroll': import("vue").Directive;
    lazy: import("vue").Directive;
    loading: import("vue").Directive;
    resize: import("vue").Directive;
    throttle: import("vue").Directive;
    tooltip: import("vue").Directive;
};
export declare const directiveInstances: (ClickOutsideDirective | CopyDirective | DebounceDirective | DragDirective | InfiniteScrollDirective | LazyDirective | LoadingDirective | ResizeDirective | ThrottleDirective | TooltipDirective)[];
export declare const vueDirectives: {
    'click-outside': import("vue").Directive;
    copy: import("vue").Directive;
    debounce: import("vue").Directive;
    drag: import("vue").Directive;
    'infinite-scroll': import("vue").Directive;
    lazy: import("vue").Directive;
    loading: import("vue").Directive;
    resize: import("vue").Directive;
    throttle: import("vue").Directive;
    tooltip: import("vue").Directive;
};
export default directives;
