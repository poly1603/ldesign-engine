/**
 * Engine 功能相关的组合式 API
 * 提供便捷的功能访问和状态管理
 */
import type { LogLevel } from '../../types/logger';
import type { NotificationOptions } from '../../types/notification';
/**
 * 使用通知系统
 * 提供便捷的通知发送接口
 */
export declare function useNotification(): {
    show: (options: NotificationOptions) => import("../../notifications/notification-system").NotificationInstance;
    success: (message: string, title?: string, duration?: number) => import("../../notifications/notification-system").NotificationInstance;
    error: (message: string, title?: string, duration?: number) => import("../../notifications/notification-system").NotificationInstance;
    warning: (message: string, title?: string, duration?: number) => import("../../notifications/notification-system").NotificationInstance;
    info: (message: string, title?: string, duration?: number) => import("../../notifications/notification-system").NotificationInstance;
    loading: (message: string, title?: string) => import("../../notifications/notification-system").NotificationInstance;
    clear: () => void;
};
/**
 * 使用日志系统
 * 提供响应式的日志功能
 */
export declare function useLogger(context?: string): {
    logs: import("vue").ComputedRef<{
        level: LogLevel;
        message: string;
        timestamp: Date;
    }[]>;
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    clearLogs: () => void;
};
/**
 * 使用缓存系统
 * 提供响应式的缓存管理
 */
export declare function useCache<T = unknown>(key: string, defaultValue?: T): {
    value: import("vue").ComputedRef<T | undefined>;
    set: (newValue: T, ttl?: number) => void;
    remove: () => void;
    refresh: () => void;
};
/**
 * 使用事件系统
 * 提供事件监听和发送
 */
export declare function useEvents(): {
    on: (event: string, handler: (...args: unknown[]) => void) => () => void;
    once: (event: string, handler: (...args: unknown[]) => void) => void;
    emit: (event: string, ...args: unknown[]) => void;
    off: (event: string, handler?: (...args: unknown[]) => void) => void;
};
/**
 * 使用性能监控
 * 提供性能指标的响应式访问
 */
export declare function usePerformance(): {
    metrics: import("vue").ComputedRef<Record<string, unknown>>;
    isMonitoring: import("vue").ComputedRef<boolean>;
    startMonitoring: () => void;
    stopMonitoring: () => void;
    measure: (name: string, fn: () => void | Promise<void>) => void | Promise<void>;
    mark: (name: string) => void;
};
/**
 * 使用配置系统
 * 提供配置的响应式访问和修改
 */
export declare function useConfig<T = unknown>(path: string, defaultValue?: T): {
    value: import("vue").ComputedRef<T>;
    set: (newValue: T) => void;
    reset: () => void;
};
/**
 * 使用错误处理
 * 提供错误捕获和处理
 */
export declare function useErrorHandler(): {
    errors: import("vue").ComputedRef<Error[]>;
    handle: (error: Error, context?: string) => void;
    capture: <T>(fn: () => T | Promise<T>, context?: string) => Promise<[T | null, Error | null]>;
    clearErrors: () => void;
};
/**
 * 使用插件系统
 * 提供插件状态管理
 */
export declare function usePlugins(): {
    plugins: import("vue").ComputedRef<import("../..").Plugin<import("../..").Engine>[]>;
    count: import("vue").ComputedRef<number>;
    isInstalled: (name: string) => boolean;
    getPlugin: (name: string) => import("../..").Plugin<import("../..").Engine> | undefined;
    getPluginStatus: (name: string) => import("../..").PluginStatus | undefined;
};
