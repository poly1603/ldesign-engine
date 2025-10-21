/**
 * 高级性能分析工具
 * 提供函数调用分析、组件渲染追踪和自动报告生成
 */
import type { Engine } from '../types';
import type { Logger } from '../types/logger';
export interface FunctionCallRecord {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    args?: unknown[];
    result?: unknown;
    error?: Error;
    callStack?: string;
    memoryBefore?: number;
    memoryAfter?: number;
}
export interface ComponentRenderRecord {
    componentName: string;
    renderCount: number;
    totalTime: number;
    averageTime: number;
    slowRenders: number;
    lastRenderTime: number;
    props?: Record<string, unknown>;
}
export interface ProfilerConfig {
    enableFunctionProfiling?: boolean;
    enableComponentProfiling?: boolean;
    enableMemoryProfiling?: boolean;
    sampleRate?: number;
    slowThreshold?: number;
    maxRecords?: number;
    autoReport?: boolean;
    reportInterval?: number;
}
export interface PerformanceProfileReport {
    timestamp: number;
    duration: number;
    summary: {
        totalFunctionCalls: number;
        slowFunctions: number;
        averageFunctionTime: number;
        totalComponentRenders: number;
        slowRenders: number;
        averageRenderTime: number;
        memoryGrowth: number;
    };
    topSlowFunctions: Array<{
        name: string;
        avgTime: number;
        calls: number;
    }>;
    topSlowComponents: Array<{
        name: string;
        avgTime: number;
        renders: number;
    }>;
    recommendations: string[];
}
/**
 * 性能分析器实现
 */
export declare class Profiler {
    private engine?;
    private logger?;
    private functionCalls;
    private componentRenders;
    private config;
    private enabled;
    private startTimestamp;
    private reportTimer?;
    private currentCallId;
    constructor(config?: ProfilerConfig, engine?: Engine | undefined, logger?: Logger | undefined);
    /**
     * 开始分析
     */
    start(): void;
    /**
     * 停止分析
     */
    stop(): void;
    /**
     * 是否正在分析
     */
    isEnabled(): boolean;
    /**
     * 记录函数调用开始
     */
    startFunctionCall(functionName: string, args?: unknown[]): number;
    /**
     * 记录函数调用结束
     */
    endFunctionCall(functionName: string, callId: number, result?: unknown, error?: Error): void;
    /**
     * 记录组件渲染
     */
    recordComponentRender(componentName: string, renderTime: number, props?: Record<string, unknown>): void;
    /**
     * 生成性能报告
     */
    generateReport(): PerformanceProfileReport;
    /**
     * 生成优化建议
     */
    private generateRecommendations;
    /**
     * 计算内存增长
     */
    private calculateMemoryGrowth;
    /**
     * 获取当前内存使用
     */
    private getMemoryUsage;
    /**
     * 捕获调用栈
     */
    private captureCallStack;
    /**
     * 启动自动报告
     */
    private startAutoReporting;
    /**
     * 清除记录
     */
    clearRecords(): void;
    /**
     * 获取函数调用统计
     */
    getFunctionStats(): Map<string, {
        calls: number;
        totalTime: number;
        avgTime: number;
    }>;
    /**
     * 获取组件统计
     */
    getComponentStats(): ComponentRenderRecord[];
    /**
     * 导出数据
     */
    exportData(): string;
    /**
     * 导入数据
     */
    importData(data: string): void;
    /**
     * 销毁分析器
     */
    destroy(): void;
}
/**
 * 创建性能分析器
 */
export declare function createProfiler(config?: ProfilerConfig, engine?: Engine, logger?: Logger): Profiler;
/**
 * 性能分析装饰器
 * 自动追踪函数执行性能
 */
export declare function Profile(profiler?: Profiler): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getGlobalProfiler(): Profiler;
export declare function setGlobalProfiler(profiler: Profiler): void;
