/**
 * 内存池管理系统
 * 通过对象池技术减少内存分配和垃圾回收压力
 */
export interface PoolableObject {
    reset?: () => void;
}
export declare class ObjectPool<T extends PoolableObject> {
    private factory;
    private options;
    private pool;
    private inUse;
    private created;
    private maxCreated;
    private lastCleanup;
    private readonly CLEANUP_INTERVAL;
    constructor(factory: () => T, options?: {
        maxSize?: number;
        preAllocate?: number;
        resetOnRelease?: boolean;
        maxCreated?: number;
    });
    /**
     * 从池中获取对象
     */
    acquire(): T | null;
    /**
     * 释放对象回池
     */
    release(obj: T): void;
    /**
     * 批量释放对象
     */
    releaseAll(objects: T[]): void;
    /**
     * 清空池
     */
    clear(): void;
    /**
     * Perform periodic cleanup
     */
    private maybeCleanup;
    /**
     * 获取池统计信息
     */
    getStats(): {
        poolSize: number;
        created: number;
        available: number;
    };
    private createObject;
}
/**
 * 通用内存池管理器
 */
export declare class MemoryPoolManager {
    private pools;
    private readonly MAX_POOLS;
    /**
     * 注册新的对象池
     */
    registerPool<T extends PoolableObject>(name: string, factory: () => T, options?: {
        maxSize?: number;
        preAllocate?: number;
        resetOnRelease?: boolean;
        maxCreated?: number;
    }): ObjectPool<T>;
    /**
     * 获取对象池
     */
    getPool<T extends PoolableObject>(name: string): ObjectPool<T> | undefined;
    /**
     * 获取所有池的统计信息
     */
    getAllStats(): Record<string, {
        poolSize: number;
        created: number;
        available: number;
    }>;
    /**
     * 清理所有池
     */
    clearAll(): void;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
/**
 * 数组池 - 专门用于数组的内存池
 */
export declare class ArrayPool<T> {
    private pools;
    private readonly MAX_ARRAY_SIZE;
    private readonly MAX_POOLS_PER_SIZE;
    /**
     * 获取指定大小的数组
     */
    acquire(size: number): T[];
    /**
     * 释放数组回池
     */
    release(array: T[]): void;
    private getPoolForSize;
    /**
     * 清理所有数组池
     */
    clear(): void;
}
/**
 * 字符串构建器池 - 优化字符串拼接
 */
export declare class StringBuilderPool {
    private pool;
    private maxPoolSize;
    acquire(): StringBuilder;
    release(builder: StringBuilder): void;
}
export declare class StringBuilder implements PoolableObject {
    private parts;
    private readonly MAX_PARTS;
    append(str: string): this;
    toString(): string;
    clear(): void;
    reset(): void;
}
export declare function getGlobalMemoryPoolManager(): MemoryPoolManager;
export declare const memoryPool: {
    acquire<T extends PoolableObject>(poolName: string): T | undefined;
    release<T extends PoolableObject>(poolName: string, obj: T): void;
    getStats(poolName?: string): any;
};
/**
 * 使用装饰器自动管理对象池
 */
export declare function Poolable(poolName: string): (constructor: any) => any;
