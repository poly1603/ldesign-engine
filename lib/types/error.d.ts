/**
 * 错误处理类型定义
 * 包含错误管理器、错误信息等相关类型
 */
import type { ErrorInfo } from './base';
export type ErrorHandler = (error: ErrorInfo) => void;
export interface ErrorManager {
    onError: (handler: ErrorHandler) => void;
    offError: (handler: ErrorHandler) => void;
    captureError: (error: Error, component?: unknown, info?: string) => void;
    getErrors: () => ErrorInfo[];
    hasErrors: () => boolean;
    clearErrors: () => void;
    handle: (error: Error, context?: string) => void;
}
export interface ErrorBoundary {
    catchError: (error: Error, errorInfo: unknown) => void;
    hasError: () => boolean;
    getError: () => Error | null;
    reset: () => void;
}
export interface ErrorReporter {
    report: (error: ErrorInfo) => Promise<void>;
    isEnabled: () => boolean;
    enable: () => void;
    disable: () => void;
    getConfig: () => Record<string, unknown>;
    setConfig: (config: Record<string, unknown>) => void;
}
export interface ErrorAggregator {
    add: (error: ErrorInfo) => void;
    getAggregated: () => Record<string, unknown>;
    clear: () => void;
    getConfig: () => Record<string, unknown>;
    setConfig: (config: Record<string, unknown>) => void;
}
export interface ErrorAnalyzer {
    analyze: (errors: ErrorInfo[]) => ErrorAnalysis;
    getPatterns: () => string[];
    getFrequentErrors: () => Array<{
        error: string;
        count: number;
    }>;
    getStatistics: () => ErrorStatistics;
}
export interface ErrorAnalysis {
    patterns: string[];
    frequentErrors: Array<{
        error: string;
        count: number;
    }>;
    statistics: ErrorStatistics;
    recommendations: string[];
}
export interface ErrorStatistics {
    total: number;
    byLevel: Record<string, number>;
    byTime: Record<string, number>;
    bySource: Record<string, number>;
    averageStackDepth: number;
    errorRate: number;
    warningRate: number;
}
