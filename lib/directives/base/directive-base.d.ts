/**
 * 指令基础类
 * 提供指令的基础功能和通用方法
 */
import type { DirectiveConfig, DirectiveLifecycle, EngineDirective } from '../../types';
export interface DirectiveOptions {
    name: string;
    description?: string;
    version?: string;
    author?: string;
    category?: string;
    tags?: string[];
    dependencies?: string[];
    config?: Partial<DirectiveConfig>;
}
export declare abstract class DirectiveBase implements EngineDirective {
    readonly name: string;
    readonly description?: string;
    readonly version: string;
    readonly author?: string;
    readonly category?: string;
    readonly tags?: string[];
    readonly dependencies?: string[];
    readonly config: DirectiveConfig;
    readonly lifecycle: DirectiveLifecycle;
    readonly metadata: Record<string, unknown>;
    constructor(options: DirectiveOptions);
    beforeCreate(): void;
    created(_el?: HTMLElement, _binding?: unknown): void;
    beforeMount(_el?: HTMLElement, _binding?: unknown): void;
    mounted(_el?: HTMLElement, _binding?: unknown): void;
    beforeUpdate(_el?: HTMLElement, _binding?: unknown): void;
    updated(_el?: HTMLElement, _binding?: unknown): void;
    beforeUnmount(_el?: HTMLElement, _binding?: unknown): void;
    unmounted(_el?: HTMLElement): void;
    error(error: Error): void;
    protected log(_message: string, ..._args: unknown[]): void;
    protected warn(_message: string, ..._args: unknown[]): void;
    protected error_log(_message: string, ..._args: unknown[]): void;
    protected validateElement(el: HTMLElement): boolean;
    protected validateBinding(binding: unknown): boolean;
    protected addEventListener(el: HTMLElement, event: string, handler: EventListener, options?: AddEventListenerOptions): void;
    protected removeEventListener(el: HTMLElement, event: string): void;
    protected removeAllEventListeners(el: HTMLElement): void;
    protected addClass(el: HTMLElement, className: string): void;
    protected removeClass(el: HTMLElement, className: string): void;
    protected toggleClass(el: HTMLElement, className: string): void;
    protected hasClass(el: HTMLElement, className: string): boolean;
    protected setAttribute(el: HTMLElement, name: string, value: string): void;
    protected removeAttribute(el: HTMLElement, name: string): void;
    protected getAttribute(el: HTMLElement, name: string): string | null;
    protected hasAttribute(el: HTMLElement, name: string): boolean;
}
declare global {
    interface HTMLElement {
        _directiveHandlers?: Map<string, EventListener>;
    }
}
