/**
 * WebWorker Pool Manager
 *
 * 提供高效的 WebWorker 池管理，支持：
 * - 动态 Worker 池大小调整
 * - 任务队列和优先级
 * - 自动负载均衡
 * - 错误恢复和重试
 * - 内存监控和自动清理
 */
import type { Logger } from '../types';
export interface WorkerTask<T = unknown> {
    id: string;
    type: string;
    data: T;
    priority?: number;
    timeout?: number;
    retries?: number;
    transferable?: Transferable[];
}
export interface WorkerResult<R = unknown> {
    id: string;
    success: boolean;
    data?: R;
    error?: string;
    duration: number;
}
export interface WorkerPoolConfig {
    minWorkers?: number;
    maxWorkers?: number;
    workerScript?: string | URL | (() => Worker);
    taskTimeout?: number;
    idleTimeout?: number;
    maxRetries?: number;
    enableSharedArrayBuffer?: boolean;
    enablePreheating?: boolean;
    preheatTasks?: Array<WorkerTask>;
    enableSmartScheduling?: boolean;
    onError?: (error: Error, task: WorkerTask) => void;
    onSuccess?: (result: WorkerResult) => void;
}
export interface WorkerState {
    id: string;
    worker: Worker;
    busy: boolean;
    currentTask?: WorkerTask;
    tasksCompleted: number;
    errors: number;
    createdAt: number;
    lastUsedAt: number;
    averageTaskTime: number;
    taskTypeStats: Map<string, {
        count: number;
        totalTime: number;
    }>;
    load: number;
}
/**
 * WebWorker 池管理器
 */
export declare class WorkerPool<T = unknown, R = unknown> {
    private logger?;
    private workers;
    private taskQueue;
    private pendingTasks;
    private config;
    private idleCheckInterval?;
    private metricsInterval?;
    private isTerminated;
    private metrics;
    constructor(config?: WorkerPoolConfig, logger?: Logger | undefined);
    /**
     * 初始化 Worker 池
     */
    private initialize;
    /**
     * 预热Workers - 提前让Workers准备好执行任务
     */
    private preheatWorkers;
    /**
     * 创建新的 Worker
     */
    private createWorker;
    /**
     * 创建默认 Worker 脚本
     */
    private createDefaultWorker;
    /**
     * 执行任务
     */
    execute(task: WorkerTask<T>): Promise<WorkerResult<R>>;
    /**
     * 批量执行任务
     */
    executeBatch(tasks: WorkerTask<T>[]): Promise<WorkerResult<R>[]>;
    /**
     * 并行执行任务并合并结果
     */
    parallel<TR = R>(data: T[], mapper: (item: T, index: number) => WorkerTask<T>, reducer?: (results: TR[]) => R): Promise<R>;
    /**
     * 尝试执行任务
     */
    private tryExecuteTask;
    /**
     * 将任务加入队列
     */
    private enqueueTask;
    /**
     * 处理 Worker 消息
     */
    private handleWorkerMessage;
    /**
     * 处理 Worker 错误
     */
    private handleWorkerError;
    /**
     * 处理任务超时
     */
    private handleTaskTimeout;
    /**
     * 处理队列中的任务
     */
    private processQueue;
    /**
     * 查找空闲的 Worker（智能调度版本）
     * 根据任务类型和worker性能选择最合适的worker
     */
    private findIdleWorker;
    /**
     * 检查并清理空闲 Worker
     */
    private checkIdleWorkers;
    /**
     * 终止指定 Worker
     */
    private terminateWorker;
    /**
     * 更新性能指标
     */
    private updateMetrics;
    /**
     * 生成任务 ID
     */
    private generateTaskId;
    /**
     * 获取池状态
     */
    getStatus(): {
        workers: number;
        busyWorkers: number;
        queueSize: number;
        metrics: typeof WorkerPool.prototype.metrics;
    };
    /**
     * 调整池大小
     */
    resize(minWorkers?: number, maxWorkers?: number): void;
    /**
     * 初始化统计数据
     */
    private initStats;
    /**
     * 终止所有 Workers 和清理资源
     */
    terminate(): void;
    /**
     * 别名方法 - 用于统一接口
     */
    destroy(): void;
}
/**
 * 创建 Worker 池实例
 */
export declare function createWorkerPool<T = unknown, R = unknown>(config?: WorkerPoolConfig, logger?: Logger): WorkerPool<T, R>;
/**
 * 装饰器：在 Worker 中执行方法
 */
export declare function InWorker<T = unknown, R = unknown>(poolConfig?: WorkerPoolConfig): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
