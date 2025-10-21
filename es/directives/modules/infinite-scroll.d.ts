/**
 * 无限滚动指令
 * 当滚动到底部时触发加载更多数据
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface InfiniteScrollOptions {
    callback?: () => void | Promise<void>;
    distance?: number;
    disabled?: boolean;
    immediate?: boolean;
    container?: string | HTMLElement;
    delay?: number;
}
export declare class InfiniteScrollDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private cleanup;
    private getContainer;
    private parseConfig;
    getExample(): string;
}
export declare const vInfiniteScroll: import("vue").Directive;
export default vInfiniteScroll;
