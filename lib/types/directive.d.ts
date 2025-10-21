/**
 * 指令管理类型定义
 * 包含指令管理器、指令类型等相关类型
 */
export interface VueDirectiveBinding {
    value: unknown;
    oldValue: unknown;
    arg?: string;
    modifiers: Record<string, boolean>;
    instance: unknown;
    dir: unknown;
}
export interface VueDirectiveHooks {
    vueCreated?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    vueBeforeMount?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    vueMounted?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    vueBeforeUpdate?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    vueUpdated?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    vueBeforeUnmount?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    vueUnmounted?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
}
export interface EngineDirectiveHooks {
    beforeCreate?: () => void;
    created?: () => void;
    beforeMount?: () => void;
    mounted?: () => void;
    beforeUpdate?: () => void;
    updated?: () => void;
    beforeUnmount?: () => void;
    unmounted?: () => void;
    error?: (error: Error) => void;
}
export interface EngineDirective {
    name?: string;
    description?: string;
    version?: string;
    author?: string;
    category?: string;
    tags?: string[];
    dependencies?: string[];
    config?: DirectiveConfig;
    lifecycle?: DirectiveLifecycle;
    metadata?: Record<string, unknown>;
    beforeCreate?: () => void;
    created?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    beforeMount?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    mounted?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    beforeUpdate?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    updated?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    beforeUnmount?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    unmounted?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    error?: (error: Error) => void;
}
export interface DirectiveConfig {
    enabled: boolean;
    priority: number;
    scope: 'global' | 'local' | 'component';
    autoRegister: boolean;
    hotReload: boolean;
    validation: boolean;
    logging: boolean;
}
export interface DirectiveLifecycle {
    beforeCreate?: () => void;
    created?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    beforeMount?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    mounted?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    beforeUpdate?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    updated?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    beforeUnmount?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    unmounted?: (() => void) | ((el: HTMLElement, binding: VueDirectiveBinding) => void);
    error?: (error: Error) => void;
    autoCleanup?: boolean;
    errorHandling?: 'throw' | 'log' | 'ignore';
    performance?: {
        enableProfiling?: boolean;
        maxExecutionTime?: number;
    };
}
export interface DirectiveManager {
    register: (name: string, directive: EngineDirective | unknown) => void;
    registerBatch: (directives: Record<string, EngineDirective | unknown>) => void;
    unregister: (name: string) => void;
    get: (name: string) => EngineDirective | undefined;
    getAll: () => EngineDirective[];
    getByCategory: (category: string) => EngineDirective[];
    getByTag: (tag: string) => EngineDirective[];
    enable: (name: string) => void;
    disable: (name: string) => void;
    reload: (name: string) => void;
    validate: (directive: EngineDirective | unknown) => DirectiveValidationResult;
    clear: () => void;
    unregisterBatch: (names: string[]) => void;
    getNames: () => string[];
    has: (name: string) => boolean;
    size: () => number;
}
export interface DirectiveValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}
export interface DirectiveLoader {
    load: (path: string) => Promise<EngineDirective>;
    loadFromUrl: (url: string) => Promise<EngineDirective>;
    loadFromPackage: (packageName: string) => Promise<EngineDirective>;
    validate: (directive: unknown) => DirectiveValidationResult;
    getDependencies: (directive: EngineDirective) => string[];
}
export interface DirectiveHotReload {
    enable: (directive: EngineDirective) => void;
    disable: (directive: EngineDirective) => void;
    reload: (directive: EngineDirective) => void;
    watch: (path: string, callback: () => void) => void;
    unwatch: (path: string) => void;
    isWatching: (path: string) => boolean;
}
export interface DirectiveMarketplace {
    search: (query: string) => Promise<EngineDirective[]>;
    browse: (category?: string, tags?: string[]) => Promise<EngineDirective[]>;
    getFeatured: () => Promise<EngineDirective[]>;
    getPopular: () => Promise<EngineDirective[]>;
    getRecent: () => Promise<EngineDirective[]>;
    install: (directive: EngineDirective) => Promise<void>;
    uninstall: (name: string) => Promise<void>;
    update: (name: string) => Promise<void>;
    rate: (name: string, rating: number, review?: string) => Promise<void>;
}
export interface DirectiveValidator {
    validate: (directive: EngineDirective) => DirectiveValidationResult;
    validateSchema: (schema: unknown) => DirectiveValidationResult;
    validateDependencies: (directive: EngineDirective) => DirectiveValidationResult;
    validateCompatibility: (directive: EngineDirective, target: string) => DirectiveValidationResult;
    getSchema: () => unknown;
    setSchema: (schema: unknown) => void;
}
export interface DirectiveIsolator {
    isolate: (directive: EngineDirective) => void;
    unisolate: (name: string) => void;
    isIsolated: (name: string) => boolean;
    getIsolated: () => EngineDirective[];
    setSandbox: (enabled: boolean) => void;
    getSandboxConfig: () => SandboxConfig;
}
export interface SandboxConfig {
    enabled: boolean;
    strict: boolean;
    allowedApis: string[];
    blockedApis: string[];
    memoryLimit: number;
    timeout: number;
    networkAccess: boolean;
    fileAccess: boolean;
}
export type DirectiveType = 'vue' | 'engine' | 'hybrid';
export interface DirectiveCompatibilityChecker {
    checkType: (directive: unknown) => DirectiveType;
    isVueDirective: (directive: unknown) => boolean;
    isEngineDirective: (directive: unknown) => boolean;
    isHybridDirective: (directive: unknown) => boolean;
    convertToEngineDirective: (vueDirective: unknown) => EngineDirective;
    convertToVueDirective: (engineDirective: EngineDirective) => unknown;
}
export interface DirectiveAdapterFactory {
    createVueAdapter: (engineDirective: EngineDirective) => unknown;
    createEngineAdapter: (vueDirective: unknown) => EngineDirective;
    createHybridAdapter: (directive: unknown) => EngineDirective;
}
