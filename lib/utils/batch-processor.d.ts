/**
 * 批量处理和并发控制模块
 * 优化大量操作的性能，控制并发数量，防止系统过载
 */
export interface BatchOptions {
    batchSize?: number;
    concurrency?: number;
    delay?: number;
    onProgress?: (progress: number, total: number) => void;
    onError?: (error: Error, item: any, index: number) => void;
}
export interface QueueOptions {
    concurrency?: number;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
/**
 * 批量处理器
 */
export declare class BatchProcessor {
    /**
     * 批量处理数组 - 优化内存使用
     */
    static processInBatches<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, options?: BatchOptions): Promise<R[]>;
    /**
     * 并发处理数组
     */
    static processConcurrently<T, R>(items: T[], processor: (item: T, index: number) => Promise<R>, options?: BatchOptions): Promise<R[]>;
    /**
     * 分块处理大数组
     */
    static chunk<T>(items: T[], chunkSize: number): AsyncGenerator<T[], void, unknown>;
    /**
     * 延迟执行
     */
    private static sleep;
}
/**
 * 任务队列 - 控制并发执行
 */
export declare class TaskQueue<T = any> {
    private queue;
    private running;
    private paused;
    private options;
    constructor(options?: QueueOptions);
    /**
     * 添加任务到队列
     */
    add<R = T>(task: () => Promise<R>): Promise<R>;
    /**
     * 批量添加任务
     */
    addAll<R = T>(tasks: Array<() => Promise<R>>): Promise<R[]>;
    /**
     * 暂停队列
     */
    pause(): void;
    /**
     * 恢复队列
     */
    resume(): void;
    /**
     * 清空队列
     */
    clear(): void;
    /**
     * 获取队列状态
     */
    getStatus(): {
        pending: number;
        running: number;
        paused: boolean;
    };
    private processNext;
    private executeWithRetry;
    private executeWithTimeout;
    private sleep;
}
/**
 * 限流器 - 控制操作频率
 */
export declare class RateLimiter {
    private maxTokens;
    private refillRate;
    private tokens;
    private lastRefill;
    private queue;
    constructor(maxTokens: number, refillRate: number);
    /**
     * 获取令牌
     */
    acquire(count?: number): Promise<void>;
    /**
     * 尝试获取令牌（非阻塞）
     */
    tryAcquire(count?: number): boolean;
    private refill;
    private processQueue;
    private startRefillTimer;
}
/**
 * 数据流处理器 - 处理大量数据流
 */
export declare class StreamProcessor<T, R> {
    private processor;
    private options;
    private buffer;
    private processing;
    constructor(processor: (items: T[]) => Promise<R[]>, options?: {
        bufferSize?: number;
        flushInterval?: number;
        onFlush?: (results: R[]) => void;
    });
    /**
     * 添加数据到流
     */
    add(item: T): Promise<void>;
    /**
     * 批量添加数据
     */
    addBatch(items: T[]): Promise<void>;
    /**
     * 刷新缓冲区
     */
    flush(): Promise<void>;
    /**
     * 获取缓冲区状态
     */
    getStatus(): {
        bufferSize: number;
        processing: boolean;
    };
}
/**
 * 并发控制装饰器
 */
export declare function Concurrent(limit?: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * 限流装饰器
 */
export declare function RateLimit(maxCalls: number, perSeconds: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
