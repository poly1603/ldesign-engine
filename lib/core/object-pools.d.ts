/**
 * 集中式对象池管理
 * 为常用对象类型提供对象池，减少GC压力和内存抖动
 */
import type { Logger } from '../types';
/**
 * 通用对象池接口
 */
export interface PoolableObject {
    reset?: () => void;
}
/**
 * 对象池基类
 */
export declare class ObjectPool<T extends object> {
    protected pool: T[];
    protected inUse: WeakSet<T>;
    protected factory: () => T;
    protected resetter: (obj: T) => void;
    protected maxSize: number;
    protected stats: {
        created: number;
        acquired: number;
        released: number;
        reused: number;
    };
    constructor(factory: () => T, resetter: (obj: T) => void, maxSize?: number);
    /**
     * 获取对象
     */
    acquire(): T;
    /**
     * 释放对象
     */
    release(obj: T): void;
    /**
     * 预填充池
     */
    prefill(count: number): void;
    /**
     * 清空池
     */
    clear(): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        poolSize: number;
        created: number;
        acquired: number;
        released: number;
        reused: number;
        reuseRate: number;
    };
}
/**
 * 任务对象池
 */
export declare class TaskPool<T = any> extends ObjectPool<{
    id: string;
    type: string;
    data: T;
    priority: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: Error;
}> {
    constructor(maxSize?: number);
    /**
     * 创建任务
     */
    createTask(id: string, type: string, data: T, priority?: number): ReturnType<ObjectPool<any>['acquire']>;
}
/**
 * 通知对象池
 */
export declare class NotificationPool extends ObjectPool<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    content: string;
    duration: number;
    timestamp: number;
    actions?: Array<{
        label: string;
        action: () => void;
    }>;
}> {
    constructor(maxSize?: number);
    /**
     * 创建通知
     */
    createNotification(id: string, type: 'success' | 'error' | 'warning' | 'info', title: string, content: string, duration?: number): ReturnType<ObjectPool<any>['acquire']>;
}
/**
 * HTTP请求对象池
 */
export declare class RequestPool extends ObjectPool<{
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers: Record<string, string>;
    body?: any;
    timeout: number;
    retries: number;
    timestamp: number;
}> {
    constructor(maxSize?: number);
    /**
     * 创建请求
     */
    createRequest(url: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', options?: {
        headers?: Record<string, string>;
        body?: any;
        timeout?: number;
        retries?: number;
    }): ReturnType<ObjectPool<any>['acquire']>;
}
/**
 * 集中式对象池管理器
 */
export declare class ObjectPoolManager {
    private pools;
    private logger?;
    constructor(logger?: Logger);
    /**
     * 初始化默认对象池
     */
    private initializeDefaultPools;
    /**
     * 注册对象池
     */
    register<T extends object>(name: string, pool: ObjectPool<T>): void;
    /**
     * 获取对象池
     */
    get<T extends object>(name: string): ObjectPool<T> | undefined;
    /**
     * 获取对象（自动从对应池中获取）
     */
    acquire<T extends object>(poolName: string): T | undefined;
    /**
     * 释放对象（自动返回到对应池）
     */
    release<T extends object>(poolName: string, obj: T): void;
    /**
     * 获取所有池的统计信息
     */
    getAllStats(): Record<string, ReturnType<ObjectPool<any>['getStats']>>;
    /**
     * 清空所有对象池
     */
    clearAll(): void;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
/**
 * 创建对象池管理器
 */
export declare function createObjectPoolManager(logger?: Logger): ObjectPoolManager;
/**
 * 对象池装饰器
 * 自动从池中获取和释放对象
 */
export declare function Pooled(poolName: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getGlobalObjectPoolManager(): ObjectPoolManager;
export declare function setGlobalObjectPoolManager(manager: ObjectPoolManager): void;
