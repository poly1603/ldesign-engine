/**
 * @ldesign/engine 内存管理工具集
 *
 * 统一导出所有内存管理相关的工具
 */
import { MemoryMonitor } from './memory-monitor';
import { ResourceManager } from './resource-manager';
export { MemoryMonitor } from './memory-monitor';
export type { MemoryError, MemoryMonitorConfig, MemoryStats, MemoryWarning } from './memory-monitor';
export { ResourceManager } from './resource-manager';
/**
 * 创建带资源管理的应用上下文
 */
export declare function createManagedContext(): {
    resources: ResourceManager;
    memoryMonitor: MemoryMonitor;
    /**
     * 清理所有资源
     */
    destroy(): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        memory: import("./memory-monitor").MemoryStats;
        resources: {
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
    };
};
/**
 * 获取全局资源管理上下文
 */
export declare function getGlobalContext(): {
    resources: ResourceManager;
    memoryMonitor: MemoryMonitor;
    /**
     * 清理所有资源
     */
    destroy(): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        memory: import("./memory-monitor").MemoryStats;
        resources: {
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
    };
};
/**
 * 销毁全局资源管理上下文
 */
export declare function destroyGlobalContext(): void;
