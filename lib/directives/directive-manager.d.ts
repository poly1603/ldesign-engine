import type { DirectiveManager, DirectiveValidationResult, EngineDirective, Logger } from '../types';
export declare class DirectiveManagerImpl implements DirectiveManager {
    private directives;
    private logger?;
    constructor(logger?: Logger);
    register(name: string, directive: unknown): void;
    unregister(name: string): void;
    get(name: string): EngineDirective | undefined;
    getAll(): EngineDirective[];
    has(name: string): boolean;
    getNames(): string[];
    size(): number;
    clear(): void;
    destroy(): void;
    registerBatch(directives: Record<string, unknown>): void;
    unregisterBatch(names: string[]): void;
    getByCategory(category: string): EngineDirective[];
    getByTag(tag: string): EngineDirective[];
    enable(name: string): void;
    disable(name: string): void;
    reload(name: string): void;
    validate(_directive: EngineDirective | unknown): DirectiveValidationResult;
}
export declare function createDirectiveManager(logger?: Logger): DirectiveManager;
export declare const commonDirectives: {
    clickOutside: unknown;
    copy: unknown;
    lazy: unknown;
    debounce: unknown;
    throttle: unknown;
    permission: unknown;
    focus: unknown;
};
declare global {
    interface HTMLElement {
        _clickOutsideHandler?: (event: Event) => void;
        _copyHandler?: () => void;
        _lazyObserver?: IntersectionObserver;
        _debounceHandler?: EventListener;
        _debounceTimer?: number;
        _debounceDelay?: number;
        _throttleHandler?: EventListener;
    }
}
