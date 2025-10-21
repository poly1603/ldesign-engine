import type { Logger, StateManager } from '../types';
/**
 * 状态管理器实现
 *
 * 提供响应式状态管理，包括：
 * - 嵌套状态支持
 * - 监听器管理
 * - 历史记录追踪
 * - 内存优化
 */
export declare class StateManagerImpl implements StateManager {
    private logger?;
    private state;
    private watchers;
    private changeHistory;
    private historyIndex;
    private historySize;
    private maxHistorySize;
    private batchUpdates;
    private batchTimer;
    private cleanupTimer;
    private readonly CLEANUP_INTERVAL;
    private pathCache;
    private readonly MAX_CACHE_SIZE;
    constructor(logger?: Logger | undefined);
    /**
     * 获取状态值 - 优化内存访问（使用LRU缓存）
     * @param key 状态键，支持嵌套路径（如 'user.profile.name'）
     * @returns 状态值或undefined
     */
    get<T = unknown>(key: string): T | undefined;
    /**
     * 设置状态值
     * @param key 状态键，支持嵌套路径
     * @param value 要设置的值
     */
    set<T = unknown>(key: string, value: T): void;
    remove(key: string): void;
    /**
     * 清空所有状态和监听器
     */
    clear(): void;
    watch<T = unknown>(key: string, callback: (newValue: T, oldValue: T) => void): () => void;
    private triggerWatchers;
    private getNestedValue;
    private setNestedValue;
    private deleteNestedValue;
    has(key: string): boolean;
    keys(): string[];
    private getAllKeys;
    getSnapshot(): Record<string, unknown>;
    /**
     * 高效深拷贝方法 - 极致优化版
     * 使用迭代方式替代递归，避免栈溢出
     * 使用WeakMap追踪循环引用，减少内存占用
     */
    private deepClone;
    restoreFromSnapshot(snapshot: Record<string, unknown>): void;
    merge(newState: Record<string, unknown>): void;
    private deepMerge;
    getStats(): {
        totalKeys: number;
        totalWatchers: number;
        memoryUsage: string;
    };
    namespace(ns: string): StateNamespace;
    getState(): Record<string, unknown>;
    setState(newState: Partial<Record<string, unknown>>): void;
    /**
     * 启动定期清理任务
     * @private
     */
    private startPeriodicCleanup;
    private cleanupOldHistory;
    private cleanupEmptyWatchers;
    private recordChange;
    getChangeHistory(limit?: number): Array<{
        path: string;
        oldValue: unknown;
        newValue: unknown;
        timestamp: number;
    }>;
    clearHistory(): void;
    undo(): boolean;
    getPerformanceStats(): {
        totalChanges: number;
        recentChanges: number;
        batchedUpdates: number;
        memoryUsage: number;
    };
    /**
     * 使路径缓存失效（优化版 - LRU缓存）
     * @private
     */
    private invalidatePathCache;
    /**
     * 清理路径缓存（LRU自动管理，无需手动清理）
     * @private
     */
    private cleanupPathCache;
}
export declare class StateNamespace implements StateManager {
    private stateManager;
    private namespaceName;
    constructor(stateManager: StateManager, namespaceName: string);
    private getKey;
    get<T = unknown>(key: string): T | undefined;
    set<T = unknown>(key: string, value: T): void;
    remove(key: string): void;
    has(key: string): boolean;
    watch<T = unknown>(key: string, callback: (newValue: T, oldValue: T) => void): () => void;
    clear(): void;
    keys(): string[];
    namespace(name: string): StateManager;
    getState(): Record<string, unknown>;
    setState(newState: Partial<Record<string, unknown>>): void;
}
export interface StateManagerWithDestroy extends StateManager {
    destroy: () => void;
}
/**
 * 创建状态管理器实例
 * @param logger 日志器（可选）
 * @returns 带销毁方法的状态管理器
 */
export declare function createStateManager(logger?: Logger): StateManagerWithDestroy;
export declare const stateModules: {
    user: (stateManager: StateManager) => {
        setUser: (user: unknown) => void;
        getUser: () => unknown;
        setToken: (token: string) => void;
        getToken: () => unknown;
        logout: () => void;
        isLoggedIn: () => boolean;
    };
    app: (stateManager: StateManager) => {
        setLoading: (loading: boolean) => void;
        isLoading: () => {};
        setError: (error: string | null) => void;
        getError: () => unknown;
        clearError: () => void;
        setTitle: (title: string) => void;
        getTitle: () => unknown;
    };
    settings: (stateManager: StateManager) => {
        setSetting: (key: string, value: unknown) => void;
        getSetting: (key: string, defaultValue?: unknown) => unknown;
        removeSetting: (key: string) => void;
        getAllSettings: () => {};
        resetSettings: () => void;
    };
};
