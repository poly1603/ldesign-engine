/**
 * Enhanced Reactive State Management System
 *
 * Provides advanced state management features including:
 * - Computed states with dependency tracking
 * - State transactions with rollback support
 * - Deep reactivity with Vue 3 integration
 * - State persistence with versioning
 */
import type { Logger } from '../types';
import { type ComputedRef, type Ref, type WatchCallback, type WatchOptions } from 'vue';
export type StateValue = unknown;
export type StateGetter<T = StateValue> = () => T;
export type StateSetter<T = StateValue> = (value: T) => void;
export type StateUpdater<T = StateValue> = (oldValue: T) => T;
export interface ComputedStateDefinition<T = StateValue> {
    get: StateGetter<T>;
    set?: StateSetter<T>;
    cache?: boolean;
}
export interface StateTransaction {
    id: string;
    timestamp: number;
    operations: Array<{
        type: 'set' | 'remove' | 'clear';
        path: string;
        oldValue?: unknown;
        newValue?: unknown;
    }>;
    status: 'pending' | 'committed' | 'rolled-back';
}
export interface StatePersistenceOptions {
    key: string;
    storage?: Storage;
    serialize?: (value: unknown) => string;
    deserialize?: (value: string) => unknown;
    version?: number;
    migrate?: (oldState: unknown, oldVersion: number) => unknown;
}
export interface ReactiveCollection<T = unknown> {
    items: Ref<T[]>;
    add: (item: T) => void;
    remove: (index: number) => void;
    update: (index: number, item: T) => void;
    clear: () => void;
    find: (predicate: (item: T) => boolean) => T | undefined;
    filter: (predicate: (item: T) => boolean) => T[];
    map: <U>(mapper: (item: T) => U) => U[];
    forEach: (callback: (item: T, index: number) => void) => void;
    size: ComputedRef<number>;
    isEmpty: ComputedRef<boolean>;
}
/**
 * Enhanced Reactive State Manager
 *
 * Extends the basic state manager with advanced reactive features
 * Now with SSR support and state hydration
 */
/**
 * 增强的响应式状态管理器
 *
 * 提供高级状态管理特性：
 * - 计算属性与依赖追踪
 * - 事务支持与回滚
 * - SSR支持与状态hydration
 * - 持久化与版本迁移
 * - 内存优化与资源管理
 */
export declare class ReactiveStateManager {
    private logger?;
    private ssrContext?;
    private state;
    private computedStates;
    private watchers;
    private transactions;
    private currentTransaction;
    private persistenceOptions;
    private collections;
    private isSSR;
    private hydrationPromise;
    private stateSnapshots;
    private maxSnapshots;
    private readonly MAX_COMPUTED;
    private readonly MAX_COLLECTIONS;
    private readonly MAX_TRANSACTIONS;
    private readonly MAX_PERSISTENCE;
    private readonly MAX_WATCHERS;
    private storageEventHandler;
    private pathValueCache;
    constructor(logger?: Logger | undefined, ssrContext?: {
        initialState?: Record<string, unknown>;
    } | undefined);
    /**
     * Get a reactive reference to a state value
     */
    getRef<T = unknown>(key: string): Ref<T | undefined>;
    /**
     * Get a shallow reactive reference (better performance for large objects)
     */
    getShallowRef<T = unknown>(key: string): Ref<T | undefined>;
    /**
     * Define a computed state that derives from other states - 优化版：限制数量
     */
    defineComputed<T = unknown>(key: string, definition: ComputedStateDefinition<T> | StateGetter<T>): ComputedRef<T>;
    /**
     * Get a computed state value
     */
    getComputed<T = unknown>(key: string): ComputedRef<T> | undefined;
    /**
     * Create a reactive collection with helper methods - 优化版：限制数量
     */
    createCollection<T = unknown>(key: string, initialItems?: T[]): ReactiveCollection<T>;
    /**
     * Get a reactive collection
     */
    getCollection<T = unknown>(key: string): ReactiveCollection<T> | undefined;
    /**
     * Start a new transaction - 优化版：限制事务数量
     */
    beginTransaction(id?: string): string;
    /**
     * Commit the current transaction
     */
    commitTransaction(): Promise<void>;
    /**
     * Rollback the current transaction
     */
    rollbackTransaction(): Promise<void>;
    /**
     * Execute a function within a transaction
     */
    transaction<T>(fn: () => T | Promise<T>, options?: {
        id?: string;
        retries?: number;
    }): Promise<T>;
    /**
     * Set a value with transaction support
     */
    set<T = unknown>(key: string, value: T): void;
    /**
     * Update a value using an updater function
     */
    update<T = unknown>(key: string, updater: StateUpdater<T>): void;
    /**
     * Setup persistence for a state key - 优化版：限制持久化键数量
     */
    persist(key: string, options: StatePersistenceOptions): void;
    /**
     * 监听状态变化 - 使用Vue的watch API
     * @param key 要监听的键或键数组
     * @param callback 回调函数
     * @param options 监听选项
     * @returns 取消监听的函数
     */
    watch<T = unknown>(key: string | string[], callback: WatchCallback<T, T>, options?: WatchOptions): () => void;
    /**
     * Create a derived state using a selector function
     */
    select<T = unknown>(selector: (state: Record<string, unknown>) => T): ComputedRef<T>;
    /**
     * Batch multiple state updates
     */
    batch(updates: Array<{
        key: string;
        value: unknown;
    }>): void;
    /**
     * Subscribe to state changes with pattern matching
     */
    subscribe(pattern: string | RegExp, callback: (key: string, value: unknown) => void): () => void;
    private getNestedValue;
    private setNestedValue;
    private deleteNestedValue;
    private setupPersistence;
    private loadFromPersistence;
    private saveToPersistence;
    private generateTransactionId;
    private delay;
    /**
     * SSR: Serialize state for server-side rendering
     */
    serialize(options?: {
        include?: string[];
        exclude?: string[];
        compress?: boolean;
    }): string;
    /**
     * SSR: Hydrate state on client side
     */
    hydrate(serializedState: string | Record<string, unknown>): Promise<void>;
    /**
     * Generate SSR script tag for state injection
     */
    generateSSRScript(): string;
    /**
     * Time Travel: Create a state snapshot - 优化版：使用环形缓冲区
     */
    createSnapshot(label?: string): string;
    /**
     * Time Travel: Restore from snapshot
     */
    restoreSnapshot(snapshotId: string | number): boolean;
    /**
     * Time Travel: Get snapshot history
     */
    getSnapshotHistory(): Array<{
        index: number;
        timestamp: number;
        size: number;
    }>;
    /**
     * Time Travel: Clear snapshot history - 优化版
     */
    clearSnapshots(): void;
    /**
     * Export state for debugging
     */
    exportState(format?: 'json' | 'csv' | 'yaml'): string;
    /**
     * Import state from external source
     */
    importState(data: string, format?: 'json' | 'csv' | 'yaml'): boolean;
    /**
     * 清理旧的监听器 - 新增方法
     * @private
     */
    private cleanupOldWatchers;
    /**
     * 清理所有状态和资源 - 完全增强版
     *
     * 按照正确的顺序清理所有资源，确保没有内存泄漏
     */
    dispose(): void;
    /**
     * 别名方法 - 用于统一接口
     */
    destroy(): void;
    /**
     * Clear state (helper method)
     */
    private clear;
}
/**
 * Create a reactive state manager instance
 */
export declare function createReactiveStateManager(logger?: Logger, ssrContext?: {
    initialState?: Record<string, unknown>;
}): ReactiveStateManager;
/**
 * SSR helper: Create state manager for server
 */
export declare function createSSRStateManager(initialState?: Record<string, unknown>, logger?: Logger): ReactiveStateManager;
