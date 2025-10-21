/**
 * 快速设置工具
 * 🚀 提供简化的API，让使用更简单
 */
/**
 * 快速创建缓存管理器 - 使用优化的默认配置
 */
export declare function quickCache<T = unknown>(options?: {
    maxSize?: number;
    ttl?: number;
    persistent?: boolean;
}): import("../cache/cache-manager").CacheManager<T>;
/**
 * 快速创建日志器 - 使用优化的默认配置
 */
export declare function quickLogger(options?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    console?: boolean;
    prefix?: string;
}): import("../logger/logger").UnifiedLogger;
/**
 * 快速创建性能管理器 - 使用优化的默认配置
 */
export declare function quickPerformance(options?: {
    monitoring?: boolean;
    fpsTracking?: boolean;
    memoryTracking?: boolean;
}): import("../performance/performance-manager").PerformanceManager;
/**
 * 一键设置所有优化的管理器
 */
export interface QuickSetupResult {
    cache: ReturnType<typeof quickCache>;
    logger: ReturnType<typeof quickLogger>;
    performance: ReturnType<typeof quickPerformance>;
    cleanup: () => void;
}
export declare function quickSetup(options?: {
    cache?: Parameters<typeof quickCache>[0];
    logger?: Parameters<typeof quickLogger>[0];
    performance?: Parameters<typeof quickPerformance>[0];
}): QuickSetupResult;
/**
 * 创建轻量级缓存 - 最小化内存占用
 */
export declare function lightCache<T = unknown>(): import("../cache/cache-manager").CacheManager<T>;
/**
 * 创建轻量级日志器 - 只记录错误
 */
export declare function lightLogger(prefix?: string): import("../logger/logger").UnifiedLogger;
export declare function getDefaultCache(): import("../cache/cache-manager").CacheManager<unknown>;
export declare function getDefaultLogger(): import("../logger/logger").UnifiedLogger;
export declare function createQuickLogger(options?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    maxLogs?: number;
    showTimestamp?: boolean;
    showContext?: boolean;
    prefix?: string;
}): import("../logger/logger").UnifiedLogger;
export declare function createQuickCacheManager<T = unknown>(options?: {
    maxSize?: number;
    defaultTTL?: number;
    cleanupInterval?: number;
    enableMemoryLimit?: boolean;
    memoryLimit?: number;
}): import("../cache/cache-manager").CacheManager<T>;
export declare function createQuickPerformanceManager(options?: {
    sampleRate?: number;
    monitorMemory?: boolean;
    monitorNetwork?: boolean;
    monitorComponents?: boolean;
    reportInterval?: number;
}): import("../performance/performance-manager").PerformanceManager;
