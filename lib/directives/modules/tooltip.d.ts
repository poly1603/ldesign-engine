/**
 * 工具提示指令
 * 显示悬浮提示信息
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface TooltipOptions {
    content?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    delay?: number;
    disabled?: boolean;
    trigger?: 'hover' | 'click' | 'focus';
    className?: string;
    offset?: number;
    html?: boolean;
}
export declare class TooltipDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private setupTooltip;
    private cleanupTooltip;
    private createTooltip;
    private positionTooltip;
    private parseConfig;
    getExample(): string;
}
export declare const vTooltip: import("vue").Directive;
export default vTooltip;
