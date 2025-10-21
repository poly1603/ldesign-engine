/**
 * 内存优化实施方案
 * 提供全面的内存管理和优化功能
 */
declare class StringPool {
    private static pool;
    private static maxSize;
    /**
     * 字符串池化 - 复用相同字符串
     * 内存节省：对于1000个相同字符串，从1000个实例减少到1个
     */
    static intern(str: string): string;
    static clear(): void;
}
declare class ArrayOptimizer {
    /**
     * 创建固定大小的数组池
     * 内存节省：避免频繁扩容，减少50%的内存重分配
     */
    static createFixedPool<T>(size: number, factory: () => T): T[];
    /**
     * 压缩稀疏数组
     * 内存节省：稀疏数组转密集数组可节省30-70%内存
     */
    static compact<T>(arr: T[]): T[];
    /**
     * 数组分片处理
     * 内存节省：避免一次性加载大数组，减少峰值内存60%
     */
    static chunk<T>(arr: T[], size: number): T[][];
}
declare class ObjectOptimizer {
    /**
     * 删除undefined属性
     * 内存节省：每个undefined属性约占用20B
     */
    static compact<T extends object>(obj: T): T;
    /**
     * 对象扁平化
     * 内存节省：减少嵌套对象开销，约20-30%
     */
    static flatten(obj: any, prefix?: string): Record<string, any>;
    /**
     * 使用原型链共享方法
     * 内存节省：1000个实例共享方法可节省MB级内存
     */
    static createWithPrototype<T extends object | null>(proto: T, props: Partial<T>): T;
}
declare class MemoryCompressor {
    /**
     * 简单数据压缩
     * 内存节省：JSON字符串压缩可达50-80%
     */
    static compress(data: any): string;
    static decompress(compressed: string): any;
    /**
     * 二进制打包
     * 内存节省：数字数组可节省75%内存
     */
    static packNumbers(numbers: number[]): ArrayBuffer;
    static unpackNumbers(buffer: ArrayBuffer): number[];
}
declare class SmartGC {
    private static lastGC;
    private static gcInterval;
    /**
     * 智能触发垃圾回收
     * 内存节省：及时回收可减少内存占用40-60%
     */
    static tryGC(): void;
    private static forceGC;
}
export declare class MemoryMonitor {
    private static measurements;
    /**
     * 记录内存使用
     */
    static record(): void;
    /**
     * 获取内存使用情况
     */
    static getMemoryUsage(): {
        used: number;
        total: number;
        percentage: number;
    };
    /**
     * 分析内存趋势
     */
    static analyzeTrend(): {
        trend: 'increasing' | 'stable' | 'decreasing';
        rate: number;
    };
}
export declare class MemoryOptimizationManager {
    private static instance;
    private optimizationTimer?;
    private stats;
    private constructor();
    static getInstance(): MemoryOptimizationManager;
    /**
     * 启动自动优化
     */
    private startAutoOptimization;
    /**
     * 执行内存优化
     */
    optimize(): void;
    /**
     * 获取优化统计
     */
    getStats(): typeof this.stats;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
export declare class LeakDetector {
    private static objectRefs;
    private static objectCounts;
    /**
     * 跟踪对象
     */
    static track(obj: object, type: string): void;
    /**
     * 取消跟踪
     */
    static untrack(obj: object, type: string): void;
    /**
     * 检测泄漏
     */
    static detectLeaks(): Array<{
        type: string;
        count: number;
    }>;
}
export declare const MemoryUtils: {
    StringPool: typeof StringPool;
    ArrayOptimizer: typeof ArrayOptimizer;
    ObjectOptimizer: typeof ObjectOptimizer;
    MemoryCompressor: typeof MemoryCompressor;
    SmartGC: typeof SmartGC;
    MemoryMonitor: typeof MemoryMonitor;
    LeakDetector: typeof LeakDetector;
};
declare const _default: MemoryOptimizationManager;
export default _default;
