/**
 * 加载状态指令
 * 显示加载状态和加载动画
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface LoadingOptions {
    loading?: boolean;
    text?: string;
    spinner?: string;
    background?: string;
    fullscreen?: boolean;
    lock?: boolean;
}
export declare class LoadingDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private toggleLoading;
    private addLoading;
    private removeLoading;
    private createOverlay;
    private getDefaultSpinner;
    private parseConfig;
    getExample(): string;
}
export declare const vLoading: import("vue").Directive;
export default vLoading;
