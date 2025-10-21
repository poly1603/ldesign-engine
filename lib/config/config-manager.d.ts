import type { ConfigManager, ConfigSchema, ConfigSnapshot, ConfigWatcher, Logger, UnwatchFunction, ValidationResult } from '../types';
import type { ConfigLoader } from './loaders';
/**
 * 配置管理器实现
 *
 * 提供完整的配置管理功能，包括：
 * - 配置加载和保存
 * - 配置验证
 * - 配置监听
 * - 快照和回滚
 * - 环境检测
 */
export declare class ConfigManagerImpl implements ConfigManager {
    private config;
    private schema?;
    private watchers;
    private snapshots;
    private environment;
    private autoSaveInterval?;
    private maxSnapshots;
    private logger?;
    private loaders;
    private loadWatchers;
    private readonly MAX_WATCHERS_PER_PATH;
    private readonly MAX_LOADERS;
    constructor(initialConfig?: Record<string, unknown>, logger?: Logger);
    /**
     * 添加配置加载器 - 优化版：限制加载器数量
     *
     * @param loader 配置加载器实例
     * @returns this 支持链式调用
     */
    addLoader(loader: ConfigLoader): this;
    /**
     * 从所有加载器加载配置
     *
     * 按顺序加载所有配置源，后面的配置会覆盖前面的
     */
    loadFromLoaders(): Promise<void>;
    /**
     * 销毁配置管理器 - 增强版
     *
     * 清理所有监听器和定时器
     */
    destroy(): void;
    get<T = unknown>(path: string, defaultValue?: T): T;
    set(path: string, value: unknown): void;
    has(path: string): boolean;
    remove(path: string): void;
    clear(): void;
    merge(newConfig: Partial<Record<string, unknown>>): void;
    reset(path?: string): void;
    setEnvironment(env: 'development' | 'production' | 'test'): void;
    getEnvironment(): string;
    validate(schema?: ConfigSchema): ValidationResult;
    setSchema(schema: ConfigSchema): void;
    getSchema(): ConfigSchema | undefined;
    watch(path: string, callback: ConfigWatcher): UnwatchFunction;
    unwatch(path: string, callback?: ConfigWatcher): void;
    on(event: string, callback: (...args: unknown[]) => void): () => void;
    save(): Promise<void>;
    load(): Promise<void>;
    enableAutoSave(interval?: number): void;
    disableAutoSave(): void;
    createSnapshot(): ConfigSnapshot;
    restoreSnapshot(snapshot: ConfigSnapshot): void;
    getSnapshots(): ConfigSnapshot[];
    getStats(): {
        totalKeys: number;
        watchers: number;
        snapshots: number;
        lastModified: number;
        memoryUsage: string;
    };
    export(format?: 'json' | 'yaml'): string;
    import(data: string, format?: 'json' | 'yaml'): void;
    namespace(name: string): ConfigManager;
    private detectEnvironment;
    private triggerWatchers;
    private triggerMergeWatchers;
    private deleteNestedValue;
    private deepMerge;
    private validateConfig;
    private validatePath;
    private validateType;
    private getDefaultValue;
    private getDefaultConfig;
    private buildDefaultConfig;
    private getAllKeys;
    private getAllKeysFromObject;
    private toYAML;
    private fromYAML;
}
export declare class NamespacedConfigManager implements ConfigManager {
    private parent;
    private namespaceName;
    constructor(parent: ConfigManager, namespaceName: string);
    private getKey;
    get<T = unknown>(key: string, defaultValue?: T): T;
    set(key: string, value: unknown): void;
    has(key: string): boolean;
    remove(key: string): void;
    clear(): void;
    merge(config: Partial<Record<string, unknown>>): void;
    reset(path?: string): void;
    setEnvironment(env: 'development' | 'production' | 'test'): void;
    getEnvironment(): string;
    validate(schema?: ConfigSchema): ValidationResult;
    setSchema(schema: ConfigSchema): void;
    getSchema(): ConfigSchema | undefined;
    watch(key: string, callback: ConfigWatcher): UnwatchFunction;
    unwatch(key: string, callback?: ConfigWatcher): void;
    on(event: string, callback: (...args: unknown[]) => void): () => void;
    save(): Promise<void>;
    load(): Promise<void>;
    enableAutoSave(interval?: number): void;
    disableAutoSave(): void;
    createSnapshot(): ConfigSnapshot;
    restoreSnapshot(snapshot: ConfigSnapshot): void;
    getSnapshots(): ConfigSnapshot[];
    getStats(): {
        totalKeys: number;
        watchers: number;
        snapshots: number;
        lastModified: number;
        memoryUsage: string;
    };
    export(format?: 'json' | 'yaml'): string;
    import(data: string, format?: 'json' | 'yaml'): void;
    namespace(name: string): ConfigManager;
}
export declare function createConfigManager(initialConfig?: Record<string, unknown>, logger?: Logger): ConfigManager;
export declare const defaultConfigSchema: ConfigSchema;
