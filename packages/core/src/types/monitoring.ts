/**
 * 监控和日志系统类型定义
 * @module types/monitoring
 */

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * 日志输出目标
 */
export enum LogTarget {
  CONSOLE = 'console',
  FILE = 'file',
  REMOTE = 'remote',
}

/**
 * 日志条目
 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: number;
  /** 日志级别 */
  level: LogLevel;
  /** 模块名称 */
  module: string;
  /** 操作类型 */
  operation: string;
  /** 日志消息 */
  message: string;
  /** 附加数据 */
  data?: Record<string, any>;
  /** 错误对象 */
  error?: Error;
  /** 调用栈 */
  stack?: string;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  /** 最低日志级别 */
  level: LogLevel;
  /** 输出目标 */
  targets: LogTarget[];
  /** 是否包含时间戳 */
  includeTimestamp: boolean;
  /** 是否包含调用栈 */
  includeStack: boolean;
  /** 是否启用彩色输出 */
  enableColors: boolean;
  /** 是否在生产环境启用 */
  enableInProduction: boolean;
  /** 文件输出路径（用于 FILE 目标） */
  filePath?: string;
  /** 远程日志端点（用于 REMOTE 目标） */
  remoteEndpoint?: string;
  /** 模块过滤器（只记录指定模块的日志） */
  moduleFilter?: string[];
}

/**
 * 性能指标
 */
export interface PerformanceMetric {
  /** 指标名称 */
  name: string;
  /** 操作类型 */
  operation: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 持续时间（毫秒） */
  duration?: number;
  /** 相关模块 */
  module: string;
  /** 附加元数据 */
  metadata?: Record<string, any>;
  /** 是否为慢操作 */
  isSlow?: boolean;
}

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
  /** 是否启用性能监控 */
  enabled: boolean;
  /** 慢操作阈值（毫秒） */
  slowThreshold: number;
  /** 是否自动记录慢操作 */
  autoLogSlowOps: boolean;
  /** 是否收集内存信息 */
  collectMemory: boolean;
  /** 采样率（0-1，1表示记录所有操作） */
  samplingRate: number;
  /** 最大指标缓存数量 */
  maxMetrics: number;
}

/**
 * 性能跟踪器接口
 */
export interface PerformanceTracker {
  /** 开始跟踪 */
  start(name: string, module: string, metadata?: Record<string, any>): string;
  /** 结束跟踪 */
  end(id: string): PerformanceMetric | undefined;
  /** 获取指标 */
  getMetrics(): PerformanceMetric[];
  /** 清除指标 */
  clearMetrics(): void;
  /** 获取慢操作 */
  getSlowOperations(): PerformanceMetric[];
  /** 导出指标 */
  exportMetrics(): string;
}

/**
 * 日志器接口
 */
export interface Logger {
  /** Debug 日志 */
  debug(module: string, operation: string, message: string, data?: Record<string, any>): void;
  /** Info 日志 */
  info(module: string, operation: string, message: string, data?: Record<string, any>): void;
  /** Warning 日志 */
  warn(module: string, operation: string, message: string, data?: Record<string, any>): void;
  /** Error 日志 */
  error(module: string, operation: string, message: string, error?: Error, data?: Record<string, any>): void;
  /** 获取日志历史 */
  getHistory(): LogEntry[];
  /** 清除日志历史 */
  clearHistory(): void;
  /** 更新配置 */
  updateConfig(config: Partial<LoggerConfig>): void;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  /** 是否健康 */
  healthy: boolean;
  /** 检查时间戳 */
  timestamp: number;
  /** 组件状态 */
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
      metrics?: Record<string, any>;
    };
  };
  /** 整体指标 */
  metrics: {
    uptime: number;
    memoryUsage?: {
      used: number;
      total: number;
      percentage: number;
    };
    errorRate?: number;
    slowOperations?: number;
  };
}

/**
 * 监控系统配置
 */
export interface MonitoringConfig {
  /** 日志配置 */
  logging: LoggerConfig;
  /** 性能配置 */
  performance: PerformanceConfig;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
}

/**
 * 模块监控统计
 */
export interface ModuleStats {
  /** 模块名称 */
  module: string;
  /** 操作计数 */
  operationCount: number;
  /** 总耗时 */
  totalDuration: number;
  /** 平均耗时 */
  averageDuration: number;
  /** 最大耗时 */
  maxDuration: number;
  /** 最小耗时 */
  minDuration: number;
  /** 错误计数 */
  errorCount: number;
  /** 慢操作计数 */
  slowOperationCount: number;
}

/**
 * 操作上下文（用于日志和监控）
 */
export interface OperationContext {
  /** 操作ID */
  operationId: string;
  /** 模块名称 */
  module: string;
  /** 操作名称 */
  operation: string;
  /** 开始时间 */
  startTime: number;
  /** 父操作ID */
  parentId?: string;
  /** 元数据 */
  metadata?: Record<string, any>;
}