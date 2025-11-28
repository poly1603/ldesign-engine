/**
 * 统一日志工具
 * @module utils/logger
 */

import {
  LogLevel,
  LogTarget,
} from '../types/monitoring';

import type {
  LogEntry,
  LoggerConfig,
  Logger,
} from '../types/monitoring';

/**
 * 日志级别枚举（重新导出以便使用）
 */
export { LogLevel } from '../types/monitoring';

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  targets: [LogTarget.CONSOLE],
  includeTimestamp: true,
  includeStack: false,
  enableColors: true,
  enableInProduction: false,
  moduleFilter: undefined,
};

/**
 * 颜色代码（用于控制台输出）
 */
const COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m', // Green
  WARN: '\x1b[33m', // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
};

/**
 * 日志级别名称映射
 */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE',
};

/**
 * 日志器实现
 */
class LoggerImpl implements Logger {
  private config: LoggerConfig;
  private history: LogEntry[] = [];
  private maxHistorySize = 1000;
  private isProduction: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  }

  /**
   * 记录 Debug 日志
   */
  debug(module: string, operation: string, message: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, module, operation, message, undefined, data);
  }

  /**
   * 记录 Info 日志
   */
  info(module: string, operation: string, message: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, module, operation, message, undefined, data);
  }

  /**
   * 记录 Warning 日志
   */
  warn(module: string, operation: string, message: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, module, operation, message, undefined, data);
  }

  /**
   * 记录 Error 日志
   */
  error(
    module: string,
    operation: string,
    message: string,
    error?: Error,
    data?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, module, operation, message, error, data);
  }

  /**
   * 获取日志历史
   */
  getHistory(): LogEntry[] {
    return [...this.history];
  }

  /**
   * 清除日志历史
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 核心日志方法
   */
  private log(
    level: LogLevel,
    module: string,
    operation: string,
    message: string,
    error?: Error,
    data?: Record<string, any>
  ): void {
    // 检查是否应该记录日志
    if (!this.shouldLog(level, module)) {
      return;
    }

    // 创建日志条目
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      module,
      operation,
      message,
      data,
      error,
      stack: this.config.includeStack && error ? error.stack : undefined,
    };

    // 添加到历史记录
    this.addToHistory(entry);

    // 输出到各个目标
    this.config.targets.forEach((target) => {
      switch (target) {
        case LogTarget.CONSOLE:
          this.logToConsole(entry);
          break;
        case LogTarget.FILE:
          this.logToFile(entry);
          break;
        case LogTarget.REMOTE:
          this.logToRemote(entry);
          break;
      }
    });
  }

  /**
   * 判断是否应该记录日志
   */
  private shouldLog(level: LogLevel, module: string): boolean {
    // 生产环境检查
    if (this.isProduction && !this.config.enableInProduction) {
      return false;
    }

    // 级别检查
    if (level < this.config.level) {
      return false;
    }

    // 模块过滤检查
    if (this.config.moduleFilter && this.config.moduleFilter.length > 0) {
      return this.config.moduleFilter.includes(module);
    }

    return true;
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(entry: LogEntry): void {
    this.history.push(entry);

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const formatted = this.formatEntry(entry);
    const consoleFn = this.getConsoleFn(entry.level);
    consoleFn(formatted);
  }

  /**
   * 格式化日志条目
   */
  private formatEntry(entry: LogEntry): string {
    const parts: string[] = [];

    // 时间戳
    if (this.config.includeTimestamp) {
      const timestamp = new Date(entry.timestamp).toISOString();
      parts.push(this.colorize(`[${timestamp}]`, COLORS.DIM));
    }

    // 级别
    const levelName = LEVEL_NAMES[entry.level];
    const levelColor = this.getLevelColor(entry.level);
    parts.push(this.colorize(`[${levelName}]`, levelColor));

    // 模块和操作
    parts.push(this.colorize(`[${entry.module}:${entry.operation}]`, COLORS.BOLD));

    // 消息
    parts.push(entry.message);

    // 数据
    if (entry.data && Object.keys(entry.data).length > 0) {
      parts.push('\n  Data:', JSON.stringify(entry.data, null, 2));
    }

    // 错误
    if (entry.error) {
      parts.push('\n  Error:', entry.error.message);
      if (entry.stack) {
        parts.push('\n  Stack:', entry.stack);
      }
    }

    return parts.join(' ');
  }

  /**
   * 获取控制台函数
   */
  private getConsoleFn(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * 获取级别颜色
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return COLORS.DEBUG;
      case LogLevel.INFO:
        return COLORS.INFO;
      case LogLevel.WARN:
        return COLORS.WARN;
      case LogLevel.ERROR:
        return COLORS.ERROR;
      default:
        return COLORS.RESET;
    }
  }

  /**
   * 着色文本
   */
  private colorize(text: string, color: string): string {
    if (!this.config.enableColors) {
      return text;
    }
    return `${color}${text}${COLORS.RESET}`;
  }

  /**
   * 输出到文件（占位实现）
   */
  private logToFile(entry: LogEntry): void {
    // 在浏览器环境中不支持文件写入
    if (typeof window !== 'undefined') {
      return;
    }

    // Node.js 环境中的文件写入需要额外实现
    // 这里只是占位，实际实现需要使用 fs 模块
    if (this.config.filePath) {
      // TODO: 实现文件写入逻辑
      console.warn('[Logger] File logging not implemented yet');
    }
  }

  /**
   * 输出到远程（占位实现）
   */
  private logToRemote(entry: LogEntry): void {
    if (!this.config.remoteEndpoint) {
      return;
    }

    // 异步发送到远程服务器（不阻塞主流程）
    this.sendToRemote(entry).catch((error) => {
      console.error('[Logger] Failed to send log to remote:', error);
    });
  }

  /**
   * 发送到远程服务器
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status}`);
      }
    } catch (error) {
      // 静默失败，避免影响主流程
      console.error('[Logger] Remote logging error:', error);
    }
  }
}

/**
 * 全局日志器实例
 */
let globalLogger: Logger | null = null;

/**
 * 创建日志器
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new LoggerImpl(config);
}

/**
 * 获取全局日志器
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createLogger();
  }
  return globalLogger;
}

/**
 * 设置全局日志器
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * 配置全局日志器
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  const logger = getLogger();
  logger.updateConfig(config);
}

/**
 * 便捷日志函数
 */
export const logger = {
  debug: (module: string, operation: string, message: string, data?: Record<string, any>) => {
    getLogger().debug(module, operation, message, data);
  },
  info: (module: string, operation: string, message: string, data?: Record<string, any>) => {
    getLogger().info(module, operation, message, data);
  },
  warn: (module: string, operation: string, message: string, data?: Record<string, any>) => {
    getLogger().warn(module, operation, message, data);
  },
  error: (module: string, operation: string, message: string, error?: Error, data?: Record<string, any>) => {
    getLogger().error(module, operation, message, error, data);
  },
};