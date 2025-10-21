/**
 * 元素大小监听指令
 * 监听元素尺寸变化并触发回调
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface ResizeOptions {
    callback?: (entry: ResizeObserverEntry) => void;
    debounce?: number;
    immediate?: boolean;
    disabled?: boolean;
}
export declare class ResizeDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private createObserver;
    private parseConfig;
    private emitEvent;
    getExample(): string;
}
export declare const vResize: import("vue").Directive;
export default vResize;
