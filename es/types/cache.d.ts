/**
 * 缓存类型定义
 * 包含缓存管理器、缓存策略等相关类型
 */
import type { CacheStrategy } from './base';
export interface CacheOptions {
    ttl?: number;
    metadata?: Record<string, unknown>;
}
export interface CacheStorageConfig {
    prefix?: string;
    maxSize?: number;
    ttl?: number;
    compression?: boolean;
    encryption?: boolean;
    encryptionKey?: string;
    namespace?: string;
}
export interface MemoryCacheConfig extends CacheStorageConfig {
    maxMemoryUsage?: number;
    gcInterval?: number;
}
export interface LocalStorageCacheConfig extends CacheStorageConfig {
    storageKey?: string;
    quotaLimit?: number;
}
export interface IndexedDBCacheConfig extends CacheStorageConfig {
    dbName?: string;
    storeName?: string;
    version?: number;
}
export interface CacheItem<T = unknown> {
    value: T;
    expiry?: number;
    metadata?: Record<string, unknown>;
}
export interface CacheStorage {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T, options?: CacheOptions) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getSize: () => Promise<number>;
}
export interface CacheEntry<T = unknown> {
    key: string;
    value: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccess: number;
    size: number;
}
export interface CacheManager {
    get: <T = unknown>(key: string) => T | undefined;
    set: <T = unknown>(key: string, value: T, ttl?: number) => void;
    has: (key: string) => boolean;
    delete: (key: string) => boolean;
    clear: () => void;
    size: () => number;
    keys: () => string[];
    values: () => unknown[];
    entries: () => [string, unknown][];
    getStats: () => CacheStats;
    resetStats: () => void;
    namespace: (name: string) => CacheManager;
}
export interface CacheStats {
    hits: number;
    misses: number;
    total: number;
    size: number;
    maxSize: number;
    hitRate: number;
    averageAccessTime: number;
    evictions: number;
    byStrategy: Record<CacheStrategy, number>;
}
export interface CacheStrategyInterface {
    name: CacheStrategy;
    shouldEvict: (entries: CacheEntry[]) => string[];
    getEvictionCandidates: (entries: CacheEntry[], count: number) => string[];
    optimize: (entries: CacheEntry[]) => void;
}
export interface CachePersistence {
    save: (cache: Record<string, CacheEntry>) => Promise<void>;
    load: () => Promise<Record<string, CacheEntry> | null>;
    clear: () => Promise<void>;
    getSize: () => Promise<number>;
}
export interface CacheSync {
    sync: (cache: Record<string, CacheEntry>) => Promise<void>;
    getLastSync: () => Date | null;
    isSyncing: () => boolean;
    onSync: (callback: (cache: Record<string, CacheEntry>) => void) => () => void;
    onSyncError: (callback: (error: Error) => void) => void;
}
export interface CacheCompression {
    compress: (data: string) => string;
    decompress: (data: string) => string;
    getCompressionRatio: () => number;
    isCompressed: (data: string) => boolean;
}
export interface CacheEncryption {
    encrypt: (data: string, key: string) => string;
    decrypt: (data: string, key: string) => string;
    generateKey: () => string;
    validateKey: (key: string) => boolean;
}
export interface CacheCleanup {
    schedule: (interval: number) => void;
    cancel: () => void;
    isScheduled: () => boolean;
    cleanup: () => Promise<number>;
    getLastCleanup: () => Date | null;
}
export interface CacheMonitor {
    onHit: (callback: (key: string, value: unknown) => void) => () => void;
    onMiss: (callback: (key: string) => void) => () => void;
    onEviction: (callback: (key: string, reason: string) => void) => () => void;
    onSizeChange: (callback: (oldSize: number, newSize: number) => void) => () => void;
}
