/**
 * 高级缓存管理器
 * 🚀 提供分层缓存、智能预加载、自动更新等特性
 */
import type { Logger } from '../types/logger';
export declare enum CacheStrategy {
    LRU = "lru",
    LFU = "lfu",
    FIFO = "fifo",
    TTL = "ttl"
}
export interface CacheItem<T = unknown> {
    key: string;
    value: T;
    timestamp: number;
    ttl?: number;
    accessCount: number;
    lastAccessed: number;
    size?: number;
    metadata?: Record<string, unknown>;
}
export interface CacheConfig<T = unknown> {
    maxSize?: number;
    defaultTTL?: number;
    strategy?: CacheStrategy;
    enableStats?: boolean;
    maxMemory?: number;
    cleanupInterval?: number;
    layers?: {
        memory?: {
            enabled: boolean;
            maxSize: number;
            ttl: number;
        };
        localStorage?: {
            enabled: boolean;
            prefix: string;
            maxSize: number;
        };
        sessionStorage?: {
            enabled: boolean;
            prefix: string;
            maxSize: number;
        };
        indexedDB?: {
            enabled: boolean;
            dbName: string;
            storeName: string;
        };
    };
    onEvict?: (key: string, value: T) => void;
    onError?: (error: Error) => void;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    expirations: number;
    size: number;
    hitRate: number;
    memoryUsage: number;
    averageItemSize: number;
}
export declare class CacheManager<T = unknown> {
    private cache;
    private config;
    private stats;
    private cleanupTimer?;
    private totalMemory;
    private logger?;
    private layers;
    private preloadQueue;
    private updateTimers;
    private shards;
    private readonly SHARD_COUNT;
    private useSharding;
    constructor(config?: CacheConfig<T>, logger?: Logger);
    /**
     * 初始化缓存分片
     */
    private initializeShards;
    /**
     * 根据key计算分片索引（使用简单哈希）
     */
    private getShardIndex;
    /**
     * 获取缓存分片
     */
    private getShard;
    /**
     * 标准化配置
     */
    private normalizeConfig;
    /**
     * 初始化统计信息
     */
    private initStats;
    /**
     * 初始化分层缓存
     */
    private initializeLayers;
    /**
     * 获取缓存值
     */
    get(key: string): Promise<T | undefined>;
    /**
     * 从内存缓存获取（支持分片）
     */
    private getFromMemory;
    /**
     * 设置缓存值
     */
    set(key: string, value: T, ttl?: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * 删除缓存（支持分片）
     */
    delete(key: string): Promise<boolean>;
    /**
     * 获取总缓存大小（支持分片）
     */
    private getTotalSize;
    /**
     * 清空缓存（支持分片）
     */
    clear(): Promise<void>;
    /**
     * 按命名空间清理缓存键（前缀匹配，支持分片）
     */
    clearNamespace(namespace: string): Promise<void>;
    /**
     * 批量预加载
     */
    preload<K extends string>(keys: K[], loader: (key: K) => Promise<T> | T, options?: {
        ttl?: number;
        priority?: 'high' | 'normal' | 'low';
    }): Promise<void>;
    /**
     * 缓存预热
     */
    warmup<K extends string>(warmupData: Array<{
        key: K;
        loader: () => Promise<T> | T;
        ttl?: number;
    }>): Promise<void>;
    /**
     * 获取命名空间缓存
     */
    namespace(name: string): NamespacedCache<T>;
    /**
     * 获取统计信息
     */
    getStats(): CacheStats;
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 事件监听（兼容方法）
     * @param event 事件名称
     * @param callback 回调函数
     * @returns 取消监听的函数
     */
    on(event: string, callback: (...args: unknown[]) => void): () => void;
    /**
     * 确保有足够的容量（支持分片）
     */
    private ensureCapacity;
    /**
     * 淘汰缓存项
     */
    private evict;
    /**
     * 查找最久未使用的项 - 支持分片
     */
    private findLRU;
    /**
     * 查找最少使用的项（支持分片）
     */
    private findLFU;
    /**
     * 查找已过期的项（支持分片）
     */
    private findExpired;
    /**
     * 更新项顺序（支持分片）
     */
    private updateItemOrder;
    /**
     * 估算对象大小 - 极致优化版
     * 使用更精确的采样策略和缓存机制
     */
    private estimateSize;
    /**
     * 更新统计信息
     */
    private updateStats;
    /**
     * 更新命中率
     */
    private updateHitRate;
    /**
     * 启动定期清理
     */
    private startCleanup;
    /**
     * 清理过期项 - 优化版（支持分片）
     */
    private cleanup;
    /**
     * 销毁缓存管理器
     */
    destroy(): void;
}
declare class NamespacedCache<T> {
    private parent;
    private namespace;
    constructor(parent: CacheManager<T>, namespace: string);
    private prefixKey;
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
}
export declare function createCacheManager<T = unknown>(config?: CacheConfig<T>, logger?: Logger): CacheManager<T>;
export {};
