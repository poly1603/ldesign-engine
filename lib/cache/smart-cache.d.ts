/**
 * 智能缓存策略
 * 提供基于访问模式的预测性缓存和自适应TTL
 */
import type { CacheManager } from './cache-manager';
import type { Logger } from '../types';
export interface SmartCacheConfig {
    enablePatternLearning?: boolean;
    enablePredictivePrefetch?: boolean;
    enableAdaptiveTTL?: boolean;
    minAccessForPrediction?: number;
    patternWindow?: number;
    prefetchThreshold?: number;
}
/**
 * 智能缓存策略实现
 */
export declare class SmartCacheStrategy<T = unknown> {
    private cache;
    private logger?;
    private accessPatterns;
    private config;
    private predictionTimer?;
    private cleanupTimer?;
    constructor(cache: CacheManager<T>, config?: SmartCacheConfig, logger?: Logger | undefined);
    /**
     * 记录访问模式
     */
    recordAccess(key: string): void;
    /**
     * 分析访问趋势
     */
    private analyzeTrend;
    /**
     * 计算自适应TTL
     */
    calculateAdaptiveTTL(key: string, defaultTTL: number): number;
    /**
     * 获取预测性预取建议
     */
    getPrefetchCandidates(): string[];
    /**
     * 启动预测引擎
     */
    private startPredictionEngine;
    /**
     * 启动模式清理
     */
    private startPatternCleanup;
    /**
     * 清理过期的访问模式
     */
    private cleanupOldPatterns;
    /**
     * 获取访问模式统计
     */
    getStats(): {
        totalPatterns: number;
        highFrequency: number;
        mediumFrequency: number;
        lowFrequency: number;
        increasingTrend: number;
        decreasingTrend: number;
    };
    /**
     * 销毁智能缓存策略
     */
    destroy(): void;
}
/**
 * 创建智能缓存策略实例
 */
export declare function createSmartCacheStrategy<T = unknown>(cache: CacheManager<T>, config?: SmartCacheConfig, logger?: Logger): SmartCacheStrategy<T>;
