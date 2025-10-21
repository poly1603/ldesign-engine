/**
 * 防抖指令
 * 防止事件频繁触发，在指定时间内只执行最后一次
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface DebounceOptions {
    handler?: (...args: unknown[]) => void;
    delay?: number;
    event?: string;
    immediate?: boolean;
    disabled?: boolean;
}
export declare class DebounceDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private parseConfig;
    getExample(): string;
}
export declare const vDebounce: import("vue").Directive;
export default vDebounce;
