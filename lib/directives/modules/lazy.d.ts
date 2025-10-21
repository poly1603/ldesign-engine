/**
 * 懒加载指令
 * 当元素进入视口时触发加载
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface LazyOptions {
    callback?: (el: HTMLElement, entry: IntersectionObserverEntry) => void;
    src?: string;
    placeholder?: string;
    error?: string;
    loading?: string;
    threshold?: number | number[];
    rootMargin?: string;
    root?: Element | null;
    once?: boolean;
    onLoad?: (el: HTMLElement) => void;
    onError?: (el: HTMLElement, error: Error) => void;
    onEnter?: (el: HTMLElement, entry: IntersectionObserverEntry) => void;
    loadingClass?: string;
    loadedClass?: string;
    errorClass?: string;
}
export declare class LazyDirective extends DirectiveBase {
    private observers;
    private defaultPlaceholder;
    private defaultError;
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private setupElement;
    private loadElement;
    private loadImage;
    private updateClasses;
    private parseConfig;
    getExample(): string;
}
export declare const vLazy: import("vue").Directive;
export default vLazy;
