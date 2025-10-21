import type { EventHandler, EventManager, EventMap, Logger } from '../types';
export declare class EventManagerImpl<TEventMap extends EventMap = EventMap> implements EventManager<TEventMap> {
    private logger?;
    private events;
    private maxListeners;
    private sortedListenersCache;
    private eventStats;
    private eventPool;
    private weakSortedCache;
    private maxEventStats;
    private cleanupInterval;
    private cleanupTimer;
    constructor(logger?: Logger | undefined);
    private setupCleanupTimer;
    on<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>): void;
    on<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>, priority: number): void;
    on(event: string, handler: EventHandler): void;
    on(event: string, handler: EventHandler, priority: number): void;
    off<K extends keyof TEventMap>(event: K, handler?: EventHandler<TEventMap[K]>): void;
    off(event: string, handler?: EventHandler): void;
    emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void;
    emit(event: string, ...args: unknown[]): void;
    once<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>): void;
    once<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>, priority: number): void;
    once(event: string, handler: EventHandler): void;
    once(event: string, handler: EventHandler, priority: number): void;
    private addEventListener;
    listenerCount(event: string): number;
    eventNames(): string[];
    listeners(event: string): EventHandler[];
    setMaxListeners(n: number): void;
    getMaxListeners(): number;
    removeAllListeners(event?: string): void;
    prependListener(event: string, handler: EventHandler, priority?: number): void;
    /**
     * 性能优化：更新事件统计
     */
    private updateEventStats;
    /**
     * 新方法：按索引批量移除监听器
     */
    private batchRemoveIndexedListeners;
    /**
     * 性能优化：批量移除监听器
     */
    private batchRemoveListeners;
    /**
     * 性能优化：清理过期的统计数据 - 改进版
     */
    private cleanupStats;
    /**
     * 检查内存使用
     */
    private checkMemoryUsage;
    /**
     * 获取事件统计信息
     */
    getEventStats(): Map<string, {
        count: number;
        lastEmit: number;
    }>;
    /**
     * 清理所有资源 - 增强版
     */
    cleanup(): void;
    /**
     * 销毁方法 - 确保完全清理
     */
    destroy(): void;
    prependOnceListener(event: string, handler: EventHandler, priority?: number): void;
    namespace(ns: string): EventNamespace;
    /**
     * 新增：批量事件操作
     * 一次性添加多个事件监听器
     */
    addListeners(listeners: Array<{
        event: string;
        handler: EventHandler;
        options?: {
            once?: boolean;
            priority?: number;
        };
    }>): void;
    /**
     * 新增：事件管道
     * 支持事件的链式处理
     */
    pipe(sourceEvent: string, targetEvent: string, transform?: (data: unknown) => unknown): void;
    /**
     * 新增：条件事件监听
     * 只有满足条件时才触发监听器
     */
    onWhen(event: string, condition: (data: unknown) => boolean, handler: EventHandler, options?: {
        once?: boolean;
        priority?: number;
    }): void;
    /**
     * 新增：事件防抖
     * 在指定时间内只触发一次事件
     */
    debounce(event: string, delay?: number): EventDebouncer;
    /**
     * 新增：事件节流
     * 在指定时间间隔内最多触发一次事件
     */
    throttle(event: string, interval?: number): EventThrottler;
    /**
     * 插入排序 - 对小数组更高效
     */
    private insertionSort;
    getStats(): {
        totalEvents: number;
        totalListeners: number;
        events: Record<string, number>;
    };
}
export declare const ENGINE_EVENTS: {
    readonly CREATED: "engine:created";
    readonly INSTALLED: "engine:installed";
    readonly MOUNTED: "engine:mounted";
    readonly UNMOUNTED: "engine:unmounted";
    readonly DESTROYED: "engine:destroy";
    readonly ERROR: "engine:error";
    readonly PLUGIN_REGISTERED: "plugin:registered";
    readonly PLUGIN_UNREGISTERED: "plugin:unregistered";
    readonly PLUGIN_ERROR: "plugin:error";
    readonly MIDDLEWARE_ADDED: "middleware:added";
    readonly MIDDLEWARE_REMOVED: "middleware:removed";
    readonly MIDDLEWARE_ERROR: "middleware:error";
    readonly STATE_CHANGED: "state:changed";
    readonly STATE_CLEARED: "state:cleared";
    readonly CONFIG_CHANGED: "config:changed";
    readonly ROUTE_CHANGED: "route:changed";
    readonly ROUTE_ERROR: "route:error";
    readonly THEME_CHANGED: "theme:changed";
    readonly LOCALE_CHANGED: "locale:changed";
};
/**
 * 事件命名空间类 - 功能增强
 * 提供命名空间隔离的事件管理
 */
export declare class EventNamespace {
    private eventManager;
    private namespace;
    constructor(eventManager: EventManagerImpl, namespace: string);
    private getNamespacedEvent;
    on(event: string, handler: EventHandler, priority?: number): void;
    once(event: string, handler: EventHandler, priority?: number): void;
    emit(event: string, data?: unknown): void;
    off(event: string, handler?: EventHandler): void;
    clear(): void;
}
/**
 * 事件防抖器类 - 功能增强
 */
export declare class EventDebouncer {
    private eventManager;
    private event;
    private delay;
    private timeoutId?;
    private lastArgs?;
    constructor(eventManager: EventManagerImpl, event: string, delay: number);
    emit(data?: unknown): void;
    cancel(): void;
    flush(): void;
    destroy(): void;
}
/**
 * 事件节流器类 - 功能增强
 */
export declare class EventThrottler {
    private eventManager;
    private event;
    private interval;
    private lastEmitTime;
    private timeoutId?;
    private lastArgs?;
    constructor(eventManager: EventManagerImpl, event: string, interval: number);
    emit(data?: unknown): void;
    cancel(): void;
    destroy(): void;
}
export interface EventManagerWithDestroy<TEventMap extends EventMap = EventMap> extends EventManager<TEventMap> {
    destroy: () => void;
}
export declare function createEventManager<TEventMap extends EventMap = EventMap>(logger?: Logger): EventManagerWithDestroy<TEventMap>;
