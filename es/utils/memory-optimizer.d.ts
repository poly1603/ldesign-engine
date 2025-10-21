/**
 * 内存优化工具集
 * 提供全面的内存管理和优化功能
 */
import type { Logger } from '../types';
export interface MemoryOptimizationConfig {
    maxMemory?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    gcInterval?: number;
    autoGC?: boolean;
    enableObjectPooling?: boolean;
    poolMaxSize?: number;
    enableWeakRefs?: boolean;
    onMemoryWarning?: (usage: MemoryUsage) => void;
    onMemoryCritical?: (usage: MemoryUsage) => void;
}
export interface MemoryUsage {
    used: number;
    total: number;
    percentage: number;
    heap: {
        used: number;
        total: number;
        limit: number;
    };
}
export declare class ObjectPool<T extends object> {
    private pool;
    private inUse;
    private factory;
    private reset;
    private maxSize;
    private created;
    private recycled;
    constructor(factory: () => T, reset: (obj: T) => void, maxSize?: number);
    /**
     * 获取对象
     */
    acquire(): T;
    /**
     * 释放对象
     */
    release(obj: T): void;
    /**
     * 清空对象池
     */
    clear(): void;
    /**
     * 获取池大小
     */
    size(): number;
    /**
     * 预填充对象池
     */
    prefill(count: number): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        size: number;
        created: number;
        recycled: number;
        efficiency: number;
    };
}
export declare class WeakRefCache<K extends object, V extends object> {
    private cache;
    private registry?;
    constructor(onCleanup?: (key: K) => void);
    /**
     * 设置缓存值
     */
    set(key: K, value: V): void;
    /**
     * 获取缓存值
     */
    get(key: K): V | undefined;
    /**
     * 检查缓存是否存在
     */
    has(key: K): boolean;
    /**
     * 删除缓存
     */
    delete(key: K): boolean;
}
export declare class MemoryOptimizer {
    private config;
    private gcTimer?;
    private objectPools;
    private weakCaches;
    private logger?;
    private isMonitoring;
    private lastGCTime;
    private memoryCheckTimer?;
    constructor(config?: MemoryOptimizationConfig, logger?: Logger);
    /**
     * 获取内存使用情况
     */
    getMemoryUsage(): MemoryUsage;
    /**
     * 检查内存状态
     */
    checkMemory(): void;
    /**
     * 创建对象池
     */
    createObjectPool<T extends object>(name: string, factory: () => T, reset: (obj: T) => void, maxSize?: number): ObjectPool<T>;
    /**
     * 获取对象池
     */
    getObjectPool<T extends object>(name: string): ObjectPool<T> | undefined;
    /**
     * 创建弱引用缓存
     */
    createWeakCache<K extends object, V extends object>(name: string, onCleanup?: (key: K) => void): WeakRefCache<K, V>;
    /**
     * 获取弱引用缓存
     */
    getWeakCache<K extends object, V extends object>(name: string): WeakRefCache<K, V> | undefined;
    /**
     * 强制垃圾回收
     */
    forceGC(): void;
    /**
     * 启动自动垃圾回收
     */
    private startAutoGC;
    /**
     * 启动内存监控
     */
    private startMemoryMonitoring;
    /**
     * 清理不活跃的对象池
     */
    private cleanupInactivePools;
    /**
     * 优化内存使用
     */
    private optimizeMemory;
    /**
     * 优化数组内存使用
     */
    optimizeArray<T>(arr: T[]): T[];
    /**
     * 优化对象内存使用
     */
    optimizeObject<T extends object>(obj: T): T;
    /**
     * 分片处理大数据
     */
    processInChunks<T, R>(data: T[], processor: (chunk: T[]) => R | Promise<R>, chunkSize?: number): Promise<R[]>;
    /**
     * 延迟加载
     */
    createLazyLoader<T>(loader: () => T | Promise<T>): () => Promise<T>;
    /**
     * 获取统计信息
     */
    getStats(): {
        memory: MemoryUsage;
        objectPools: {
            name: string;
            size: number;
        }[];
        weakCaches: string[];
    };
    /**
     * 销毁优化器
     */
    destroy(): void;
}
export declare class MemoryLeakDetector {
    private snapshots;
    private maxSnapshots;
    private leakThreshold;
    private checkInterval;
    private timer?;
    private objectCounts;
    /**
     * 开始检测
     */
    start(): void;
    /**
     * 停止检测
     */
    stop(): void;
    /**
     * 拍摄内存快照
     */
    private takeSnapshot;
    /**
     * 分析快照
     */
    private analyzeSnapshots;
    /**
     * 获取堆使用情况
     */
    private getHeapUsage;
    /**
     * 统计对象数量
     */
    private countObjects;
    /**
     * 追踪对象
     */
    trackObject(id: string): void;
    /**
     * 取消追踪对象
     */
    untrackObject(id: string): void;
    /**
     * 获取报告
     */
    getReport(): {
        snapshots: any;
        possibleLeaks: string[];
        recommendation: string;
    };
    /**
     * 清理
     */
    destroy(): void;
}
export declare function createMemoryOptimizer(config?: MemoryOptimizationConfig, logger?: Logger): MemoryOptimizer;
export declare function createMemoryLeakDetector(): MemoryLeakDetector;
declare const _default: {
    MemoryOptimizer: typeof MemoryOptimizer;
    MemoryLeakDetector: typeof MemoryLeakDetector;
    ObjectPool: typeof ObjectPool;
    WeakRefCache: typeof WeakRefCache;
    createMemoryOptimizer: typeof createMemoryOptimizer;
    createMemoryLeakDetector: typeof createMemoryLeakDetector;
};
export default _default;
