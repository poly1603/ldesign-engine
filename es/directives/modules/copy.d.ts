/**
 * 复制到剪贴板指令
 * 点击元素时复制指定内容到剪贴板
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface CopyOptions {
    text?: string | (() => string);
    onSuccess?: (text: string) => void;
    onError?: (error: Error) => void;
    disabled?: boolean;
    immediate?: boolean;
}
export declare class CopyDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private getText;
    private copyToClipboard;
    private parseConfig;
    getExample(): string;
}
export declare const vCopy: import("vue").Directive;
export default vCopy;
