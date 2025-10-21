/**
 * 指令系统统一导出
 * 提供完整的指令系统功能
 */
export * from './base/directive-base';
export * from './base/vue-directive-adapter';
export { commonDirectives, createDirectiveManager, DirectiveManagerImpl, } from './directive-manager';
export * from './modules';
/**
 * 创建现代化指令管理器实例
 * TODO: ModernDirectiveManager 文件缺失，暂时返回 null
 */
export declare function createModernDirectiveManager(_config?: unknown): null;
/**
 * 获取所有可用的指令实例
 */
export declare function getAllDirectiveInstances(): (import("./modules").ClickOutsideDirective | import("./modules").CopyDirective | import("./modules").DebounceDirective | import("./modules").DragDirective | import("./modules").InfiniteScrollDirective | import("./modules").LazyDirective | import("./modules").LoadingDirective | import("./modules").ResizeDirective | import("./modules").ThrottleDirective | import("./modules").TooltipDirective)[];
/**
 * 获取所有可用的Vue指令
 */
export declare function getAllVueDirectives(): {
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
declare const _default: null;
export default _default;
