import type { Logger } from '../types';
export type LifecyclePhase = 'beforeInit' | 'init' | 'afterInit' | 'beforeMount' | 'mount' | 'afterMount' | 'beforeUnmount' | 'unmount' | 'afterUnmount' | 'beforeDestroy' | 'destroy' | 'afterDestroy' | 'error' | 'custom';
export type LifecycleHook<T = unknown> = (context: LifecycleContext<T>) => void | Promise<void>;
export interface LifecycleContext<T = unknown> {
    readonly phase: LifecyclePhase;
    readonly timestamp: number;
    readonly engine: T;
    readonly data?: unknown;
    readonly error?: Error;
}
export interface HookInfo<T = unknown> {
    readonly id: string;
    readonly phase: LifecyclePhase;
    readonly hook: LifecycleHook<T>;
    readonly priority: number;
    readonly once: boolean;
    readonly name?: string;
    readonly description?: string;
    readonly registeredAt: number;
}
export interface LifecycleEvent {
    readonly phase: LifecyclePhase;
    readonly timestamp: number;
    readonly duration?: number;
    readonly success: boolean;
    readonly error?: Error;
    readonly hooksExecuted: number;
    readonly data?: unknown;
}
export interface LifecycleManager<T = unknown> {
    on: (phase: LifecyclePhase, hook: LifecycleHook<T>, priority?: number) => string;
    once: (phase: LifecyclePhase, hook: LifecycleHook<T>, priority?: number) => string;
    off: (hookId: string) => boolean;
    offAll: (phase?: LifecyclePhase) => number;
    getHooks: (phase: LifecyclePhase) => HookInfo<T>[];
    getAllHooks: () => HookInfo<T>[];
    hasHooks: (phase: LifecyclePhase) => boolean;
    getHookCount: (phase?: LifecyclePhase) => number;
    execute: (phase: LifecyclePhase, engine: T, data?: unknown) => Promise<LifecycleEvent>;
    executeSync: (phase: LifecyclePhase, engine: T, data?: unknown) => LifecycleEvent;
    getCurrentPhase: () => LifecyclePhase | undefined;
    getLastEvent: () => LifecycleEvent | undefined;
    getHistory: () => LifecycleEvent[];
    isPhaseExecuted: (phase: LifecyclePhase) => boolean;
    onError: (callback: (error: Error, context: LifecycleContext<T>) => void) => () => void;
    getStats: () => {
        totalHooks: number;
        phaseStats: Record<LifecyclePhase, number>;
        executionHistory: LifecycleEvent[];
        averageExecutionTime: number;
        errorCount: number;
    };
    clear: () => void;
    reset: () => void;
}
/**
 * 生命周期管理器实现
 *
 * 负责注册、执行与统计各阶段生命周期钩子：
 * - 钩子支持优先级、一次性执行（once）
 * - 执行过程中收集历史与错误回调
 */
export declare class LifecycleManagerImpl<T = unknown> implements LifecycleManager<T> {
    private hooks;
    private phaseHooks;
    private history;
    private currentPhase?;
    private errorCallbacks;
    private hookIdCounter;
    private maxHistorySize;
    private logger?;
    private readonly MAX_HOOKS;
    private readonly MAX_ERROR_CALLBACKS;
    constructor(logger?: Logger);
    /**
     * 注册生命周期钩子。
     * @param phase 生命周期阶段
     * @param hook 钩子函数
     * @param priority 优先级，越大越先执行（默认0）
     * @returns 钩子ID
     */
    on(phase: LifecyclePhase, hook: LifecycleHook<T>, priority?: number): string;
    /**
     * 注册一次性生命周期钩子（执行后自动移除）。
     */
    once(phase: LifecyclePhase, hook: LifecycleHook<T>, priority?: number): string;
    /**
     * 移除指定钩子。
     */
    off(hookId: string): boolean;
    /**
     * 批量移除钩子，可按阶段清空。
     * @returns 被移除的钩子数量
     */
    offAll(phase?: LifecyclePhase): number;
    /**
     * 获取指定阶段的钩子（按优先级降序）。
     */
    getHooks(phase: LifecyclePhase): HookInfo<T>[];
    /**
     * 获取所有已注册钩子（按优先级降序）。
     */
    getAllHooks(): HookInfo<T>[];
    hasHooks(phase: LifecyclePhase): boolean;
    /**
     * 获取钩子数量，可选按阶段统计。
     */
    getHookCount(phase?: LifecyclePhase): number;
    /**
     * 异步执行指定阶段的所有钩子。
     * @returns 生命周期事件（包含执行结果与耗时）
     */
    execute(phase: LifecyclePhase, engine: T, data?: unknown): Promise<LifecycleEvent>;
    executeSync(phase: LifecyclePhase, engine: T, data?: unknown): LifecycleEvent;
    getCurrentPhase(): LifecyclePhase | undefined;
    getLastEvent(): LifecycleEvent | undefined;
    getHistory(): LifecycleEvent[];
    isPhaseExecuted(phase: LifecyclePhase): boolean;
    onError(callback: (error: Error, context: LifecycleContext<T>) => void): () => void;
    getStats(): {
        totalHooks: number;
        phaseStats: Record<LifecyclePhase, number>;
        executionHistory: LifecycleEvent[];
        averageExecutionTime: number;
        errorCount: number;
    };
    clear(): void;
    reset(): void;
    destroy(): void;
    private generateHookId;
    private addToHistory;
    private removeOldestHooks;
    private isCriticalPhase;
    add(hook: {
        phase: LifecyclePhase;
        handler: LifecycleHook<T>;
        priority?: number;
    }): void;
    remove(name: string): void;
    getOrder(phase: LifecyclePhase): string[];
    validate(): unknown;
    optimize(): void;
}
export declare function createLifecycleManager<T = unknown>(logger?: Logger): LifecycleManager<T>;
export declare function LifecycleHookDecorator(phase: LifecyclePhase, priority?: number): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const LIFECYCLE_PHASES: {
    readonly BEFORE_INIT: "beforeInit";
    readonly INIT: "init";
    readonly AFTER_INIT: "afterInit";
    readonly BEFORE_MOUNT: "beforeMount";
    readonly MOUNT: "mount";
    readonly AFTER_MOUNT: "afterMount";
    readonly BEFORE_UNMOUNT: "beforeUnmount";
    readonly UNMOUNT: "unmount";
    readonly AFTER_UNMOUNT: "afterUnmount";
    readonly BEFORE_DESTROY: "beforeDestroy";
    readonly DESTROY: "destroy";
    readonly AFTER_DESTROY: "afterDestroy";
    readonly ERROR: "error";
    readonly CUSTOM: "custom";
};
export declare const LIFECYCLE_ORDER: LifecyclePhase[];
export declare class LifecycleHelper {
    static isValidPhase(phase: string): phase is LifecyclePhase;
    static getPhaseIndex(phase: LifecyclePhase): number;
    static isPhaseAfter(phase1: LifecyclePhase, phase2: LifecyclePhase): boolean;
    static isPhaseBefore(phase1: LifecyclePhase, phase2: LifecyclePhase): boolean;
    static getNextPhase(phase: LifecyclePhase): LifecyclePhase | undefined;
    static getPreviousPhase(phase: LifecyclePhase): LifecyclePhase | undefined;
}
