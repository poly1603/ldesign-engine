/**
 * 基础类型定义
 * 包含引擎系统中通用的基础类型和接口
 */
export interface EngineConfig {
    appName?: string;
    version?: string;
    debug?: boolean;
    [key: string]: unknown;
}
export type Environment = 'development' | 'production' | 'test';
export interface FeatureFlags {
    enableHotReload: boolean;
    enableDevTools: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
    enableSecurityProtection: boolean;
    enableCaching: boolean;
    enableNotifications: boolean;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface Snapshot<T = unknown> {
    timestamp: number;
    data: T;
    version: string;
    metadata?: Record<string, unknown>;
}
export type UnwatchFunction = () => void;
export interface Stats {
    timestamp: number;
    [key: string]: unknown;
}
export interface ConfigSchema {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        required?: boolean;
        default?: unknown;
        validator?: (value: unknown) => boolean;
        description?: string;
        children?: ConfigSchema;
    };
}
export type ConfigPath<T> = T extends object ? {
    [K in keyof T]: K extends string ? T[K] extends object ? `${K}` | `${K}.${ConfigPath<T[K]>}` : `${K}` : never;
}[keyof T] : never;
export type ConfigValue<T, P extends string> = P extends keyof T ? T[P] : P extends `${infer K}.${infer Rest}` ? K extends keyof T ? T[K] extends object ? ConfigValue<T[K], Rest> : never : never : never;
export interface BaseManager {
    readonly name: string;
    readonly version: string;
    destroy: () => void;
    getStats: () => Stats;
}
export interface BasePlugin {
    readonly name: string;
    readonly version?: string;
    readonly description?: string;
    readonly author?: string;
    readonly dependencies?: readonly string[];
    readonly peerDependencies?: readonly string[];
    readonly optionalDependencies?: readonly string[];
}
export interface RouterAdapter {
    readonly name: string;
    readonly version: string;
    install: (engine: unknown) => void;
    navigate: (to: string, options?: Record<string, unknown>) => void;
    push: (to: string, options?: Record<string, unknown>) => void;
    replace: (to: string, options?: Record<string, unknown>) => void;
    go: (delta: number) => void;
    back: () => void;
    forward: () => void;
    getCurrentRoute: () => string;
    getCurrentParams: () => Record<string, string>;
    getCurrentQuery: () => Record<string, string>;
    onRouteChange: (callback: (route: string) => void) => () => void;
    destroy: () => void;
}
export interface StateAdapter {
    readonly name: string;
    readonly version: string;
    install: (engine: unknown) => void;
    get: <T>(key: string, defaultValue?: T) => T;
    set: <T>(key: string, value: T) => void;
    delete: (key: string) => void;
    clear: () => void;
    has: (key: string) => boolean;
    keys: () => string[];
    subscribe: (key: string, callback: (value: unknown) => void) => () => void;
    destroy: () => void;
}
export interface I18nAdapter {
    readonly name: string;
    readonly version: string;
    install: (engine: unknown) => void;
    t: (key: string, params?: Record<string, unknown>) => string;
    setLocale: (locale: string) => void;
    getLocale: () => string;
    getAvailableLocales: () => string[];
    onLocaleChange: (callback: (locale: string) => void) => () => void;
    destroy: () => void;
}
export interface ThemeAdapter {
    readonly name: string;
    readonly version: string;
    install: (engine: unknown) => void;
    setTheme: (theme: string) => void;
    getTheme: () => string;
    getAvailableThemes: () => string[];
    onThemeChange: (callback: (theme: string) => void) => () => void;
    destroy: () => void;
}
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;
export interface EventMap {
    [event: string]: unknown;
}
export type StateChangeHandler<T = unknown> = (newValue: T, oldValue: T) => void;
export interface StateMap {
    [key: string]: unknown;
}
export type StatePath<T> = T extends object ? {
    [K in keyof T]: K extends string ? T[K] extends object ? `${K}` | `${K}.${StatePath<T[K]>}` : `${K}` : never;
}[keyof T] : never;
export type StateValue<T, P extends string> = P extends keyof T ? T[P] : P extends `${infer K}.${infer Rest}` ? K extends keyof T ? T[K] extends object ? StateValue<T[K], Rest> : never : never : never;
export interface ErrorInfo {
    message: string;
    stack?: string;
    timestamp: number;
    level: 'error' | 'warn' | 'info';
    context?: Record<string, unknown>;
    component?: unknown;
    info?: string;
}
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    data?: unknown;
    context?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type NotificationAnimation = 'slide' | 'fade' | 'bounce' | 'scale' | 'flip';
export type NotificationTheme = 'light' | 'dark' | 'auto';
export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl';
export interface PerformanceMetrics {
    timestamp: number;
    duration: number;
    memory?: number;
    cpu?: number;
    [key: string]: unknown;
}
export interface EnvironmentInfo {
    platform: string;
    browser: {
        name: string;
        version: string;
    };
    device: {
        type: string;
        isMobile: boolean;
    };
    features: Record<string, boolean>;
    [key: string]: unknown;
}
