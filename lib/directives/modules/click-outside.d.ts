/**
 * 点击外部区域指令
 * 当用户点击元素外部时触发回调
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface ClickOutsideOptions {
    handler?: (event: Event) => void;
    exclude?: string[] | HTMLElement[];
    capture?: boolean;
    disabled?: boolean;
}
export declare class ClickOutsideDirective extends DirectiveBase {
    private documentHandler;
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private parseConfig;
    getExample(): string;
}
export declare const vClickOutside: import("vue").Directive;
export default vClickOutside;
