/**
 * 日志类型定义
 * 包含日志管理器、日志条目等相关类型
 */
import type { LogEntry, LogLevel } from './base';
export type { LogEntry, LogLevel } from './base';
export interface Logger {
    debug: (message: string, data?: unknown) => void;
    info: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
    error: (message: string, data?: unknown) => void;
    setLevel: (level: LogLevel) => void;
    getLevel: () => LogLevel;
    getLogs: () => LogEntry[];
    clearLogs: () => void;
    clear: () => void;
    setMaxLogs: (max: number) => void;
    getMaxLogs: () => number;
}
export interface LogConfig {
    level?: LogLevel;
    maxLogs?: number;
    showTimestamp?: boolean;
    showContext?: boolean;
    prefix?: string;
}
export type LoggerOptions = LogConfig;
export interface LogTransport {
    name: string;
    send: (entry: LogEntry) => Promise<void>;
    isAvailable: () => boolean;
    getConfig: () => Record<string, unknown>;
    setConfig: (config: Record<string, unknown>) => void;
}
export interface LogFormatter {
    name: string;
    format: (entry: LogEntry) => string;
    getConfig: () => Record<string, unknown>;
    setConfig: (config: Record<string, unknown>) => void;
}
export interface LogFilter {
    name: string;
    shouldLog: (entry: LogEntry) => boolean;
    getConfig: () => Record<string, unknown>;
    setConfig: (config: Record<string, unknown>) => void;
}
export interface LogAggregator {
    add: (entry: LogEntry) => void;
    getAggregated: () => Record<string, unknown>;
    clear: () => void;
    getConfig: () => Record<string, unknown>;
    setConfig: (config: Record<string, unknown>) => void;
}
export interface LogAnalyzer {
    analyze: (logs: LogEntry[]) => LogAnalysis;
    getPatterns: () => string[];
    getAnomalies: () => LogEntry[];
    getStatistics: () => LogStatistics;
}
export interface LogAnalysis {
    patterns: string[];
    anomalies: LogEntry[];
    statistics: LogStatistics;
    recommendations: string[];
}
export interface LogStatistics {
    total: number;
    byLevel: Record<LogLevel, number>;
    byTime: Record<string, number>;
    bySource: Record<string, number>;
    averageMessageLength: number;
    errorRate: number;
    warningRate: number;
}
