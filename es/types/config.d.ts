/**
 * 配置管理类型定义
 * 包含配置管理器、配置Schema等相关类型
 */
import type { ConfigPath, ConfigSchema, ConfigValue, UnwatchFunction, ValidationResult } from './base';
export type { EngineConfig } from './base';
export interface StrictEngineConfig {
    readonly app: {
        readonly name: string;
        readonly version: string;
        readonly description?: string;
        readonly author?: string;
        readonly homepage?: string;
    };
    readonly environment: 'development' | 'production' | 'test';
    readonly debug: boolean;
    readonly features: Readonly<{
        enableHotReload: boolean;
        enableDevTools: boolean;
        enablePerformanceMonitoring: boolean;
        enableErrorReporting: boolean;
        enableSecurityProtection: boolean;
        enableCaching: boolean;
        enableNotifications: boolean;
    }>;
    readonly logger: Readonly<LoggerConfig>;
    readonly cache: Readonly<CacheConfig>;
    readonly security: Readonly<SecurityConfig>;
    readonly performance: Readonly<PerformanceConfig>;
    readonly notifications: Readonly<NotificationConfig>;
    readonly env: Readonly<Record<string, string | undefined>>;
    readonly custom: Readonly<Record<string, unknown>>;
}
export interface EnhancedEngineConfig {
    app: {
        name: string;
        version: string;
        description?: string;
        author?: string;
        homepage?: string;
    };
    environment: 'development' | 'production' | 'test';
    debug: boolean;
    features: {
        enableHotReload: boolean;
        enableDevTools: boolean;
        enablePerformanceMonitoring: boolean;
        enableErrorReporting: boolean;
        enableSecurityProtection: boolean;
        enableCaching: boolean;
        enableNotifications: boolean;
    };
    logger: LoggerConfig;
    cache: CacheConfig;
    security: SecurityConfig;
    performance: PerformanceConfig;
    notifications: NotificationConfig;
    env: {
        [key: string]: string | undefined;
    };
    custom: Record<string, unknown>;
}
export interface ConfigSnapshot {
    timestamp: number;
    config: Record<string, unknown>;
    environment: 'development' | 'production' | 'test';
    version: string;
}
export type ConfigWatcher = (newValue: unknown, oldValue: unknown, path: string) => void;
export interface ConfigManager<TConfig = Record<string, unknown>> {
    get: (<P extends ConfigPath<TConfig>>(path: P, defaultValue?: ConfigValue<TConfig, P>) => ConfigValue<TConfig, P>) & (<T = unknown>(path: string, defaultValue?: T) => T);
    set: (<P extends ConfigPath<TConfig>>(path: P, value: ConfigValue<TConfig, P>) => void) & ((path: string, value: unknown) => void);
    has: (path: string) => boolean;
    remove: (path: string) => void;
    clear: () => void;
    merge: (config: Partial<Record<string, unknown>>) => void;
    reset: (path?: string) => void;
    setEnvironment: (env: 'development' | 'production' | 'test') => void;
    getEnvironment: () => string;
    validate: (schema?: ConfigSchema) => ValidationResult;
    setSchema: (schema: ConfigSchema) => void;
    getSchema: () => ConfigSchema | undefined;
    watch: (path: string, callback: ConfigWatcher) => UnwatchFunction;
    unwatch: (path: string, callback?: ConfigWatcher) => void;
    on: (event: string, callback: (...args: unknown[]) => void) => () => void;
    save: () => Promise<void>;
    load: () => Promise<void>;
    enableAutoSave: (interval?: number) => void;
    disableAutoSave: () => void;
    createSnapshot: () => ConfigSnapshot;
    restoreSnapshot: (snapshot: ConfigSnapshot) => void;
    getSnapshots: () => ConfigSnapshot[];
    getStats: () => {
        totalKeys: number;
        watchers: number;
        snapshots: number;
        lastModified: number;
        memoryUsage: string;
    };
    export: (format?: 'json' | 'yaml') => string;
    import: (data: string, format?: 'json' | 'yaml') => void;
    namespace: (name: string) => ConfigManager;
}
export interface LoggerConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
    maxLogs: number;
    enableConsole: boolean;
    enableStorage: boolean;
    storageKey: string;
    transports: string[];
}
export interface CacheConfig {
    enabled: boolean;
    maxSize: number;
    defaultTTL: number;
    strategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
    enableStats: boolean;
    cleanupInterval: number;
}
export interface SecurityConfig {
    xss: {
        enabled: boolean;
        allowedTags: string[];
        allowedAttributes: Record<string, string[]>;
    };
    csrf: {
        enabled: boolean;
        tokenName: string;
        headerName: string;
    };
    csp: {
        enabled: boolean;
        directives: Record<string, string[]>;
        reportOnly: boolean;
    };
}
export interface PerformanceConfig {
    enabled: boolean;
    sampleRate: number;
    maxEntries: number;
    thresholds: {
        responseTime: {
            good: number;
            poor: number;
        };
        fps: {
            good: number;
            poor: number;
        };
        memory: {
            warning: number;
            critical: number;
        };
    };
}
export interface NotificationConfig {
    enabled: boolean;
    maxNotifications: number;
    defaultDuration: number;
    defaultPosition: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    defaultTheme: 'light' | 'dark' | 'auto';
}
export interface ConfigValidator {
    validate: (config: Record<string, unknown>, schema: ConfigSchema) => ValidationResult;
    sanitize: (config: Record<string, unknown>, schema: ConfigSchema) => Record<string, unknown>;
    merge: (base: Record<string, unknown>, override: Record<string, unknown>) => Record<string, unknown>;
}
export interface ConfigPersistence {
    save: (config: Record<string, unknown>, key: string) => Promise<void>;
    load: (key: string) => Promise<Record<string, unknown> | null>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    keys: () => Promise<string[]>;
}
export interface ConfigEncryption {
    encrypt: (data: string, key: string) => string;
    decrypt: (data: string, key: string) => string;
    generateKey: () => string;
    validateKey: (key: string) => boolean;
}
export interface ConfigSync {
    sync: (config: Record<string, unknown>) => Promise<void>;
    getLastSync: () => Date | null;
    isSyncing: () => boolean;
    onSync: (callback: (config: Record<string, unknown>) => void) => () => void;
    onSyncError: (callback: (error: Error) => void) => void;
}
export interface ConfigMigration {
    migrate: (fromVersion: string, toVersion: string, config: Record<string, unknown>) => Promise<Record<string, unknown>>;
    getMigrationPath: (fromVersion: string, toVersion: string) => string[];
    validateMigration: (migration: Record<string, unknown>) => boolean;
    rollback: (config: Record<string, unknown>, targetVersion: string) => Promise<Record<string, unknown>>;
}
