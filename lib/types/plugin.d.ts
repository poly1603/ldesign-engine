/**
 * 插件系统类型定义
 * 包含插件、插件管理器等相关类型
 */
import type { BaseManager, BasePlugin } from './base';
import type { Engine } from './engine';
export interface PluginMetadata {
    readonly name: string;
    readonly version: string;
    readonly description?: string;
    readonly author?: string;
    readonly homepage?: string;
    readonly keywords?: readonly string[];
    readonly dependencies?: readonly string[];
    readonly peerDependencies?: readonly string[];
    readonly optionalDependencies?: readonly string[];
}
export interface PluginContext<_TEngine = Engine> {
    readonly engine: _TEngine;
    readonly logger: unknown;
    readonly config: unknown;
    readonly events: unknown;
}
export interface Plugin<TEngine = Engine> extends BasePlugin {
    install: (context: PluginContext<TEngine>) => void | Promise<void>;
    uninstall?: (context: PluginContext<TEngine>) => void | Promise<void>;
    beforeInstall?: (context: PluginContext<TEngine>) => void | Promise<void>;
    afterInstall?: (context: PluginContext<TEngine>) => void | Promise<void>;
    beforeUninstall?: (context: PluginContext<TEngine>) => void | Promise<void>;
    afterUninstall?: (context: PluginContext<TEngine>) => void | Promise<void>;
    isEnabled?: () => boolean;
    readonly config?: Record<string, unknown>;
    readonly metadata?: Partial<PluginMetadata>;
}
export type PluginStatus = 'pending' | 'installing' | 'installed' | 'uninstalling' | 'error';
export interface PluginInfo<TEngine = Engine> {
    readonly plugin: Plugin<TEngine>;
    readonly status: PluginStatus;
    readonly installTime?: number;
    readonly error?: Error;
    readonly dependencies: readonly string[];
    readonly dependents: readonly string[];
}
export interface PluginManager<TEngine = Engine> extends BaseManager {
    register: (plugin: Plugin<TEngine>) => Promise<void>;
    unregister: (name: string) => Promise<void>;
    get: (name: string) => Plugin<TEngine> | undefined;
    getInfo: (name: string) => PluginInfo<TEngine> | undefined;
    getAll: () => Plugin<TEngine>[];
    getAllInfo: () => PluginInfo<TEngine>[];
    isRegistered: (name: string) => boolean;
    has: (name: string) => boolean;
    getStatus: (name: string) => PluginStatus | undefined;
    checkDependencies: (plugin: Plugin<TEngine>) => {
        satisfied: boolean;
        missing: string[];
        conflicts: string[];
    };
    getLoadOrder: () => string[];
    getDependencyGraph: () => Record<string, string[]>;
    validateDependencies: () => {
        valid: boolean;
        errors: string[];
    };
    resolveDependencies: (plugins: Plugin<TEngine>[]) => Plugin<TEngine>[];
    getStats: () => {
        total: number;
        loaded: string[];
        dependencies: Record<string, string[]>;
        installed: number;
        pending: number;
        errors: number;
        averageInstallTime: number;
        timestamp: number;
    };
    findByKeyword: (keyword: string) => Plugin<TEngine>[];
    findByAuthor: (author: string) => Plugin<TEngine>[];
    findByDependency: (dependency: string) => Plugin<TEngine>[];
    getInstalledPlugins: () => Plugin<TEngine>[];
    isInstalled: (name: string) => boolean;
    getPlugin: (name: string) => Plugin<TEngine> | undefined;
    getPluginStatus: (name: string) => PluginStatus | undefined;
    initializeAll: () => Promise<void>;
}
export interface PluginLoader<TEngine = Engine> {
    load: (path: string) => Promise<Plugin<TEngine>>;
    loadFromURL: (url: string) => Promise<Plugin<TEngine>>;
    loadFromPackage: (packageName: string) => Promise<Plugin<TEngine>>;
    validate: (plugin: Plugin<TEngine>) => {
        valid: boolean;
        errors: string[];
    };
    getLoadHistory: () => Array<{
        timestamp: number;
        path: string;
        success: boolean;
        error?: string;
    }>;
}
export interface PluginHotReload<_TEngine = Engine> {
    enable: () => void;
    disable: () => void;
    isEnabled: () => boolean;
    reload: (pluginName: string) => Promise<void>;
    watch: (pluginPath: string) => void;
    unwatch: (pluginPath: string) => void;
    onReload: (callback: (pluginName: string) => void) => () => void;
}
export interface PluginMarketplace<TEngine = Engine> {
    search: (query: string) => Promise<Plugin<TEngine>[]>;
    getCategories: () => Promise<string[]>;
    getPopular: () => Promise<Plugin<TEngine>[]>;
    getLatest: () => Promise<Plugin<TEngine>[]>;
    getRating: (pluginName: string) => Promise<{
        rating: number;
        reviews: number;
    }>;
    install: (pluginName: string) => Promise<void>;
    uninstall: (pluginName: string) => Promise<void>;
    update: (pluginName: string) => Promise<void>;
}
export interface PluginValidator<TEngine = Engine> {
    validate: (plugin: Plugin<TEngine>) => {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    validateDependencies: (plugin: Plugin<TEngine>, installed: Plugin<TEngine>[]) => {
        satisfied: boolean;
        missing: string[];
    };
    validateSecurity: (plugin: Plugin<TEngine>) => {
        safe: boolean;
        risks: string[];
    };
    validatePerformance: (plugin: Plugin<TEngine>) => {
        acceptable: boolean;
        issues: string[];
    };
}
export interface PluginIsolator<TEngine = Engine> {
    isolate: (plugin: Plugin<TEngine>) => Promise<void>;
    deisolate: (plugin: Plugin<TEngine>) => Promise<void>;
    isIsolated: (plugin: Plugin<TEngine>) => boolean;
    getIsolationInfo: (plugin: Plugin<TEngine>) => Record<string, unknown>;
    setIsolationLevel: (plugin: Plugin<TEngine>, level: 'strict' | 'moderate' | 'loose') => void;
}
