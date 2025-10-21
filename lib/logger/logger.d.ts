/**
 * 统一的日志系统
 * 📝 整合了所有日志功能，提供高性能、可扩展的日志解决方案
 *
 * 合并了以下文件：
 * - logger/logger.ts
 * - utils/logging-system.ts
 */
import type { Logger as ILogger, LogEntry, LoggerOptions, LogLevel } from '../types/logger';
export interface LogConfig extends LoggerOptions {
    level?: LogLevel;
    enabled?: boolean;
    maxLogs?: number;
    console?: boolean;
    remote?: boolean;
    file?: boolean;
    remoteUrl?: string;
    remoteHeaders?: Record<string, string>;
    remoteBatchSize?: number;
    remoteInterval?: number;
    format?: 'json' | 'text' | 'pretty';
    timestamp?: boolean;
    context?: boolean;
    async?: boolean;
    bufferSize?: number;
    flushInterval?: number;
    filters?: Array<(entry: LogEntry) => boolean>;
    plugins?: LogPlugin[];
}
export interface LogPlugin {
    name: string;
    process: (entry: LogEntry) => LogEntry | null;
    flush?: () => void;
}
export interface LogTransport {
    name: string;
    write: (entry: LogEntry) => void | Promise<void>;
    flush?: () => void | Promise<void>;
}
export interface LogStats {
    total: number;
    byLevel: Record<LogLevel, number>;
    errors: number;
    dropped: number;
    buffered: number;
}
export declare class UnifiedLogger implements ILogger {
    private config;
    private logs;
    private buffer;
    private transports;
    private plugins;
    private stats;
    private flushTimer?;
    private remoteQueue;
    private remoteTimer?;
    private readonly MAX_LOGS_ABSOLUTE;
    private readonly MAX_BUFFER;
    private readonly MAX_REMOTE_QUEUE;
    constructor(config?: LogConfig);
    /**
     * 标准化配置 - 优化版：更严格的默认值
     */
    private normalizeConfig;
    /**
     * 初始化统计信息
     */
    private initStats;
    /**
     * 初始化传输器
     */
    private initTransports;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, error?: unknown, ...args: unknown[]): void;
    /**
     * 核心日志方法
     */
    private log;
    /**
     * 写入日志条目
     */
    private writeEntry;
    /**
     * 添加到历史记录 - 优化版：使用环形缓冲区避免数组扩容
     */
    private addToHistory;
    /**
     * 检查是否应该记录
     */
    private shouldLog;
    /**
     * 更新统计信息
     */
    private updateStats;
    /**
     * 刷新缓冲区
     */
    flush(): void;
    /**
     * 启动定期刷新
     */
    private startFlushTimer;
    /**
     * 启动远程日志定时器
     */
    private startRemoteTimer;
    /**
     * 刷新远程日志 - 优化版：限制队列大小避免无限增长
     */
    private flushRemote;
    /**
     * 创建子日志器
     */
    child(context: Record<string, unknown>): UnifiedLogger;
    /**
     * 使用插件
     */
    use(plugin: LogPlugin): void;
    /**
     * 添加传输器
     */
    addTransport(name: string, transport: LogTransport): void;
    /**
     * 移除传输器
     */
    removeTransport(name: string): void;
    /**
     * 设置日志级别
     */
    setLevel(level: LogLevel): void;
    /**
     * 获取日志级别
     */
    getLevel(): LogLevel;
    /**
     * 获取日志历史
     */
    getLogs(filter?: Partial<LogEntry>): LogEntry[];
    /**
     * 清空日志
     */
    clearLogs(): void;
    /**
     * 清空日志（别名方法，与 Logger 接口兼容）
     */
    clear(): void;
    /**
     * 设置最大日志数
     */
    setMaxLogs(max: number): void;
    /**
     * 获取最大日志数
     */
    getMaxLogs(): number;
    /**
     * 获取统计信息
     */
    getStats(): LogStats;
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 销毁日志器
     */
    destroy(): void;
}
/**
 * 性能插件 - 记录日志耗时
 */
export declare class PerformancePlugin implements LogPlugin {
    name: string;
    private timings;
    private maxTimings;
    process(entry: LogEntry): LogEntry;
    flush(): void;
}
/**
 * 错误追踪插件 - 增强错误信息
 */
export declare class ErrorTrackingPlugin implements LogPlugin {
    name: string;
    process(entry: LogEntry): LogEntry;
}
/**
 * 采样插件 - 按比例采样日志
 */
export declare class SamplingPlugin implements LogPlugin {
    private sampleRate;
    name: string;
    constructor(sampleRate?: number);
    process(entry: LogEntry): LogEntry | null;
}
export declare function createUnifiedLogger(config?: LogConfig): UnifiedLogger;
/**
 * 创建日志器（兼容 LogLevel 字符串和 LogConfig 对象）
 * @param levelOrConfig 日志级别字符串或配置对象
 */
export declare function createLogger(levelOrConfig?: LogLevel | LogConfig): UnifiedLogger;
export { UnifiedLogger as Logger };
/**
 * 获取或创建命名日志器实例
 * @param name 日志器名称
 * @param config 可选的配置
 * @returns 日志器实例
 */
export declare function getLogger(name?: string, config?: LogConfig): UnifiedLogger;
