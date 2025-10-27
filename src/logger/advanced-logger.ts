/**
 * 增强日志系统
 * 
 * 提供企业级日志功能：
 * - 日志分级输出（按模块）
 * - 日志缓冲和批量上传
 * - 性能日志自动分析
 * - 多种格式化器（JSON、Pretty、Compact）
 * - 远程日志上传
 */

import type { LogLevel } from '../types/logger'

/**
 * 日志条目
 */
export interface LogEntry {
  /** 日志级别 */
  level: LogLevel
  /** 日志消息 */
  message: string
  /** 时间戳 */
  timestamp: number
  /** 模块名称 */
  module?: string
  /** 上下文数据 */
  context?: Record<string, unknown>
  /** 堆栈跟踪 */
  stack?: string
  /** 性能数据 */
  performance?: {
    duration?: number
    memory?: number
  }
}

/**
 * 日志格式化器接口
 */
export interface LogFormatter {
  format(entry: LogEntry): string
}

/**
 * JSON格式化器
 */
export class JSONFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify(entry)
  }
}

/**
 * Pretty格式化器（适合开发环境）
 */
export class PrettyFormatter implements LogFormatter {
  private readonly LEVEL_COLORS = {
    debug: '\x1b[36m',   // 青色
    info: '\x1b[32m',    // 绿色
    warn: '\x1b[33m',    // 黄色
    error: '\x1b[31m'    // 红色
  }

  private readonly RESET = '\x1b[0m'

  format(entry: LogEntry): string {
    const color = this.LEVEL_COLORS[entry.level]
    const timestamp = new Date(entry.timestamp).toISOString()
    const module = entry.module ? `[${entry.module}]` : ''
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''

    return `${color}[${timestamp}] [${entry.level.toUpperCase()}]${this.RESET} ${module} ${entry.message}${context}`
  }
}

/**
 * Compact格式化器（适合生产环境）
 */
export class CompactFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      entry.level,
      entry.module || '',
      entry.message
    ]

    if (entry.context) {
      parts.push(JSON.stringify(entry.context))
    }

    return parts.join('|')
  }
}

/**
 * 日志传输器接口
 */
export interface LogTransport {
  /** 传输名称 */
  name: string
  /** 最小日志级别 */
  minLevel: LogLevel
  /** 发送日志 */
  send(entry: LogEntry): void | Promise<void>
  /** 批量发送 */
  sendBatch?(entries: LogEntry[]): void | Promise<void>
}

/**
 * 控制台传输器
 */
export class ConsoleTransport implements LogTransport {
  name = 'console'
  minLevel: LogLevel = 'debug'

  constructor(
    private formatter: LogFormatter = new PrettyFormatter()
  ) {}

  send(entry: LogEntry): void {
    const message = this.formatter.format(entry)
    
    switch (entry.level) {
      case 'debug':
        console.debug(message)
        break
      case 'info':
        console.info(message)
        break
      case 'warn':
        console.warn(message)
        break
      case 'error':
        console.error(message)
        break
    }
  }
}

/**
 * 远程传输器
 * 
 * 将日志发送到远程服务器
 */
export class RemoteTransport implements LogTransport {
  name = 'remote'
  minLevel: LogLevel = 'warn' // 默认只上传warn和error

  private buffer: LogEntry[] = []
  private flushTimer?: number

  constructor(
    private endpoint: string,
    private options: {
      batchSize?: number
      flushInterval?: number
      headers?: Record<string, string>
    } = {}
  ) {
    const { flushInterval = 5000 } = options

    // 定期刷新缓冲区
    this.flushTimer = window.setInterval(() => {
      this.flush()
    }, flushInterval)
  }

  send(entry: LogEntry): void {
    this.buffer.push(entry)

    const { batchSize = 10 } = this.options

    if (this.buffer.length >= batchSize) {
      this.flush()
    }
  }

  async sendBatch(entries: LogEntry[]): Promise<void> {
    if (entries.length === 0) return

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers
        },
        body: JSON.stringify({ logs: entries })
      })
    } catch (error) {
      console.error('日志上传失败:', error)
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const entries = this.buffer.splice(0)
    await this.sendBatch(entries)
  }

  /**
   * 销毁传输器
   */
  destroy(): void {
    if (this.flushTimer !== undefined) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}

/**
 * 增强日志器
 * 
 * 支持多传输器、模块化、性能分析等功能
 */
export class AdvancedLogger {
  private transports: LogTransport[] = []
  private buffer: LogEntry[] = []
  private maxBufferSize = 1000
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }

  /**
   * 添加传输器
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  /**
   * 移除传输器
   */
  removeTransport(name: string): void {
    const index = this.transports.findIndex(t => t.name === name)
    if (index > -1) {
      this.transports.splice(index, 1)
    }
  }

  /**
   * 记录日志
   */
  log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    module?: string
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      module,
      context,
      stack: level === 'error' ? new Error().stack : undefined
    }

    // 添加到缓冲区
    this.addToBuffer(entry)

    // 发送到所有传输器
    for (const transport of this.transports) {
      if (this.shouldSend(entry.level, transport.minLevel)) {
        try {
          transport.send(entry)
        } catch (error) {
          console.error(`日志传输失败 [${transport.name}]:`, error)
        }
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, context?: Record<string, unknown>, module?: string): void {
    this.log('debug', message, context, module)
  }

  /**
   * 信息日志
   */
  info(message: string, context?: Record<string, unknown>, module?: string): void {
    this.log('info', message, context, module)
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: Record<string, unknown>, module?: string): void {
    this.log('warn', message, context, module)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: unknown, module?: string): void {
    const context = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : { error }

    this.log('error', message, context, module)
  }

  /**
   * 性能日志
   */
  performance(
    operation: string,
    duration: number,
    context?: Record<string, unknown>,
    module?: string
  ): void {
    this.log('info', `Performance: ${operation}`, {
      ...context,
      duration: `${duration}ms`
    }, module)
  }

  /**
   * 判断是否应该发送日志
   */
  private shouldSend(entryLevel: LogLevel, minLevel: LogLevel): boolean {
    return this.levelPriority[entryLevel] >= this.levelPriority[minLevel]
  }

  /**
   * 添加到缓冲区
   */
  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry)

    // 限制缓冲区大小
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift()
    }
  }

  /**
   * 获取缓冲的日志
   */
  getBuffer(): LogEntry[] {
    return [...this.buffer]
  }

  /**
   * 清空缓冲区
   */
  clearBuffer(): void {
    this.buffer = []
  }

  /**
   * 获取日志统计
   */
  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    }

    for (const entry of this.buffer) {
      stats[entry.level]++
    }

    return stats
  }

  /**
   * 按模块获取日志
   */
  getByModule(module: string): LogEntry[] {
    return this.buffer.filter(entry => entry.module === module)
  }

  /**
   * 按级别获取日志
   */
  getByLevel(level: LogLevel): LogEntry[] {
    return this.buffer.filter(entry => entry.level === level)
  }

  /**
   * 按时间范围获取日志
   */
  getByTimeRange(start: number, end: number): LogEntry[] {
    return this.buffer.filter(
      entry => entry.timestamp >= start && entry.timestamp <= end
    )
  }

  /**
   * 导出日志（JSON格式）
   */
  export(): string {
    return JSON.stringify(this.buffer, null, 2)
  }

  /**
   * 销毁日志器
   */
  destroy(): void {
    // 销毁所有传输器
    for (const transport of this.transports) {
      if ('destroy' in transport && typeof transport.destroy === 'function') {
        transport.destroy()
      }
    }

    this.transports = []
    this.buffer = []
  }
}

/**
 * 创建增强日志器
 * 
 * @example
 * ```typescript
 * const logger = createAdvancedLogger()
 * 
 * // 添加控制台输出
 * logger.addTransport(new ConsoleTransport(new PrettyFormatter()))
 * 
 * // 添加远程上传
 * logger.addTransport(new RemoteTransport('https://api.example.com/logs'))
 * 
 * // 记录日志
 * logger.info('应用启动', { version: '1.0.0' }, 'App')
 * logger.error('发生错误', error, 'UserService')
 * ```
 */
export function createAdvancedLogger(): AdvancedLogger {
  const logger = new AdvancedLogger()
  
  // 默认添加控制台传输器
  logger.addTransport(new ConsoleTransport(new PrettyFormatter()))
  
  return logger
}


