/**
 * 性能预算管理器
 * 监控和管理应用性能预算
 */
export interface PerformanceBudget {
    /** 包体积限制（字节） */
    bundleSize?: number;
    /** 初始加载时间限制（毫秒） */
    initialLoadTime?: number;
    /** 内存使用限制（字节） */
    memoryUsage?: number;
    /** FPS 最低限制 */
    minFps?: number;
    /** DOM 节点数量限制 */
    domNodes?: number;
    /** 网络请求数量限制 */
    networkRequests?: number;
    /** 网络请求总大小限制（字节） */
    networkSize?: number;
}
export interface PerformanceMetric {
    name: string;
    value: number;
    limit: number;
    unit: string;
    exceeded: boolean;
    percentage: number;
}
export type BudgetExceededCallback = (metric: PerformanceMetric) => void;
export declare class PerformanceBudgetManager {
    private budget;
    private onExceeded?;
    private metrics;
    private monitoring;
    private observer?;
    private animationFrameId?;
    constructor(budget: PerformanceBudget, onExceeded?: BudgetExceededCallback);
    /**
     * 初始化指标
     */
    private initializeMetrics;
    /**
     * 开始监控
     */
    startMonitoring(): void;
    /**
     * 停止监控
     */
    stopMonitoring(): void;
    /**
     * 监控加载性能
     */
    private monitorLoadPerformance;
    /**
     * 监控内存使用
     */
    private monitorMemory;
    /**
     * 监控 FPS
     */
    private monitorFPS;
    /**
     * 监控 DOM 节点数量
     */
    private monitorDOMNodes;
    /**
     * 监控网络请求
     */
    private monitorNetwork;
    /**
     * 更新指标
     */
    private updateMetric;
    /**
     * 手动检查特定指标
     */
    checkMetric(name: string, value: number): PerformanceMetric | null;
    /**
     * 获取所有指标
     */
    getAllMetrics(): PerformanceMetric[];
    /**
     * 获取超出预算的指标
     */
    getExceededMetrics(): PerformanceMetric[];
    /**
     * 获取性能报告
     */
    getReport(): {
        passed: boolean;
        metrics: PerformanceMetric[];
        exceeded: PerformanceMetric[];
        summary: string;
    };
    /**
     * 重置指标
     */
    reset(): void;
    /**
     * 更新预算
     */
    updateBudget(budget: Partial<PerformanceBudget>): void;
    /**
     * 销毁
     */
    destroy(): void;
}
