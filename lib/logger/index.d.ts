/**
 * Logger 模块主导出文件
 * 📝 统一的日志系统
 */
export type { Logger as ILogger, LogEntry, LoggerOptions, LogLevel } from '../types/logger';
export { createLogger, createUnifiedLogger, ErrorTrackingPlugin, type LogConfig, Logger, type LogPlugin, type LogStats, type LogTransport, PerformancePlugin, SamplingPlugin, UnifiedLogger } from './logger';
export declare const defaultLogger: import("./logger").UnifiedLogger;
