/**
 * 内存监控器
 * 实时追踪和报告内存使用情况，帮助及早发现内存泄漏
 *
 * @example
 * ```typescript
 * const monitor = new MemoryMonitor({
 *   onWarning: (info) => console.warn('Memory warning:', info),
 *   onError: (info) => console.error('Memory error:', info)
 * });
 *
 * monitor.start();
 *
 * // 稍后...
 * monitor.stop();
 * monitor.destroy();
 * ```
 */
export interface MemoryWarning {
    type: 'threshold' | 'growth' | 'leak';
    current: number;
    threshold?: number;
    growthRate?: number;
    message: string;
    timestamp: number;
}
export interface MemoryError {
    type: 'threshold' | 'critical';
    current: number;
    threshold: number;
    message: string;
    timestamp: number;
}
export interface MemoryStats {
    current: number | null;
    history: number[];
    average: number;
    peak: number;
    minimum: number;
    growthRate: number;
    trend: 'increasing' | 'stable' | 'decreasing';
}
export interface MemoryMonitorConfig {
    /** 检查间隔（毫秒），默认 30000 (30秒) */
    checkInterval?: number;
    /** 阈值配置 */
    thresholds?: {
        /** 警告阈值（字节），默认 50MB */
        warning?: number;
        /** 错误阈值（字节），默认 100MB */
        error?: number;
        /** 增长率阈值（百分比），默认 0.5 (50%) */
        growth?: number;
    };
    /** 警告回调 */
    onWarning?: (info: MemoryWarning) => void;
    /** 错误回调 */
    onError?: (info: MemoryError) => void;
    /** 是否自动启动，默认 false */
    autoStart?: boolean;
    /** 历史记录最大数量，默认 20 */
    maxHistorySize?: number;
}
export declare class MemoryMonitor {
    private checkInterval;
    private intervalId;
    private memoryHistory;
    private maxHistorySize;
    private onWarning?;
    private onError?;
    private thresholds;
    private isRunning;
    private destroyed;
    constructor(config?: MemoryMonitorConfig);
    /**
     * 开始监控
     */
    start(): void;
    /**
     * 停止监控
     */
    stop(): void;
    /**
     * 立即执行一次检查
     */
    check(): void;
    /**
     * 检查阈值
     */
    private checkThresholds;
    /**
     * 检查增长率
     */
    private checkGrowthRate;
    /**
     * 检查潜在内存泄漏
     * 如果内存持续增长且没有下降，可能存在泄漏
     */
    private checkPotentialLeak;
    /**
     * 获取当前内存使用（字节）
     */
    private getMemoryUsage;
    /**
     * 计算内存增长率
     * 返回从第一个记录到最后一个记录的增长率
     */
    private calculateGrowthRate;
    /**
     * 格式化字节数为可读字符串
     */
    private formatBytes;
    /**
     * 获取内存统计信息
     */
    getStats(): MemoryStats;
    /**
     * 重置历史记录
     */
    resetHistory(): void;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<MemoryMonitorConfig>): void;
    /**
     * 清理资源
     */
    destroy(): void;
    /**
     * 检查是否已销毁
     */
    isDestroyed(): boolean;
    /**
     * 检查是否正在运行
     */
    isMonitoring(): boolean;
}
/**
 * 创建内存监控器实例
 */
export declare function createMemoryMonitor(config?: MemoryMonitorConfig): MemoryMonitor;
