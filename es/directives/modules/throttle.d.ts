/**
 * 节流指令
 * 限制事件触发频率，在指定时间内最多执行一次
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface ThrottleOptions {
    handler?: (...args: unknown[]) => void;
    delay?: number;
    event?: string;
    disabled?: boolean;
    leading?: boolean;
    trailing?: boolean;
}
export declare class ThrottleDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private parseConfig;
    getExample(): string;
}
export declare const vThrottle: import("vue").Directive;
export default vThrottle;
