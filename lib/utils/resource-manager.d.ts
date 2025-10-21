/**
 * 统一资源管理器
 * 用于追踪和清理所有需要手动释放的资源
 *
 * @example
 * ```typescript
 * const resources = new ResourceManager();
 *
 * // 注册资源
 * const timerId = resources.registerTimeout(setTimeout(() => {}, 1000));
 * resources.registerListener(element, 'click', handler);
 *
 * // 自动清理所有资源
 * resources.destroy();
 * ```
 */
declare global {
    interface WeakRef<T extends object> {
        deref: () => T | undefined;
    }
    const WeakRef: {
        new <T extends object>(target: T): WeakRef<T>;
    };
}
type WeakRefType<T extends object> = typeof WeakRef extends undefined ? any : WeakRef<T>;
export declare class ResourceManager {
    private timers;
    private intervals;
    private observers;
    private listeners;
    private animationFrames;
    private weakRefs;
    private cleanupFunctions;
    private destroyed;
    /**
     * 注册定时器
     * @returns 定时器 ID
     */
    registerTimeout(id: number): number;
    /**
     * 注销定时器
     */
    unregisterTimeout(id: number): void;
    /**
     * 注册间隔器
     * @returns 间隔器 ID
     */
    registerInterval(id: number): number;
    /**
     * 注销间隔器
     */
    unregisterInterval(id: number): void;
    /**
     * 注册观察器
     * @returns 观察器实例
     */
    registerObserver<T extends ResizeObserver | MutationObserver | IntersectionObserver>(observer: T): T;
    /**
     * 注销观察器
     */
    unregisterObserver<T extends ResizeObserver | MutationObserver | IntersectionObserver>(observer: T): void;
    /**
     * 注册事件监听器
     */
    registerListener(target: EventTarget, event: string, listener: EventListener, options?: AddEventListenerOptions): void;
    /**
     * 注销事件监听器
     */
    unregisterListener(target: EventTarget, event: string, listener: EventListener, options?: EventListenerOptions): void;
    /**
     * 注册动画帧
     * @returns 动画帧 ID
     */
    registerAnimationFrame(id: number): number;
    /**
     * 注销动画帧
     */
    unregisterAnimationFrame(id: number): void;
    /**
     * 注册弱引用
     * 用于追踪对象，但不阻止垃圾回收
     */
    registerWeakRef<T extends object>(ref: WeakRefType<T>): WeakRefType<T>;
    /**
     * 注册自定义清理函数
     */
    registerCleanup(fn: () => void): void;
    /**
     * 注销自定义清理函数
     */
    unregisterCleanup(fn: () => void): void;
    /**
     * 检查是否已销毁
     */
    private checkDestroyed;
    /**
     * 获取资源统计信息
     */
    getStats(): {
        timers: number;
        intervals: number;
        observers: number;
        listenerTargets: number;
        totalListeners: number;
        animationFrames: number;
        weakRefs: number;
        cleanupFunctions: number;
        destroyed: boolean;
    };
    /**
     * 清理所有资源
     * 应在不再需要时调用
     */
    destroy(): void;
    /**
     * 检查是否已销毁
     */
    isDestroyed(): boolean;
}
/**
 * 创建资源管理器实例
 */
export declare function createResourceManager(): ResourceManager;
export {};
