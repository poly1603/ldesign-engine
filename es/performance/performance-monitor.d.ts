/**
 * 高性能监控工具
 * 提供实时性能监控、内存分析、性能瓶颈检测等功能
 */
import type { Engine } from '../types';
export interface PerformanceMetrics {
    cpu: {
        usage: number;
        idle: number;
    };
    memory: {
        used: number;
        total: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
        arrayBuffers: number;
    };
    timing: {
        [key: string]: {
            count: number;
            total: number;
            min: number;
            max: number;
            average: number;
            p50: number;
            p90: number;
            p99: number;
        };
    };
    counters: Map<string, number>;
    gauges: Map<string, number>;
}
export declare class PerformanceMonitor {
    private engine?;
    private metrics;
    private timings;
    private startTimes;
    private counters;
    private gauges;
    private observers;
    private updateInterval?;
    private readonly maxTimingSamples;
    private readonly maxMetricKeys;
    private readonly maxObservers;
    private lastCleanup;
    private readonly cleanupInterval;
    constructor(engine?: Engine | undefined);
    private initMetrics;
    /**
     * 开始性能计时
     */
    startTiming(label: string): void;
    /**
     * 结束性能计时并记录
     */
    endTiming(label: string): number;
    /**
     * 使用装饰器模式测量函数执行时间
     */
    measure<T extends (...args: any[]) => any>(label: string, fn: T): T;
    /**
     * 增加计数器
     */
    incrementCounter(name: string, value?: number): void;
    /**
     * 设置测量值
     */
    setGauge(name: string, value: number): void;
    /**
     * 获取当前指标
     */
    getMetrics(): PerformanceMetrics;
    /**
     * 重置所有指标
     */
    reset(): void;
    /**
     * 订阅性能指标更新
     */
    subscribe(callback: (metrics: PerformanceMetrics) => void): () => void;
    /**
     * 获取性能报告
     */
    getReport(): string;
    /**
     * 获取性能建议
     */
    getOptimizationSuggestions(): string[];
    /**
     * 更新计时统计 - 优化版
     */
    private updateTimingStats;
    /**
     * 定期清理过期数据
     */
    private performPeriodicCleanup;
    /**
     * 开始自动监控 - 优化频率
     */
    private startAutoMonitoring;
    /**
     * 通知所有观察者
     */
    private notifyObservers;
    /**
     * 销毁监控器
     */
    destroy(): void;
}
export declare function getGlobalPerformanceMonitor(engine?: Engine): PerformanceMonitor;
/**
 * 性能测量装饰器
 */
export declare function Measure(label?: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
