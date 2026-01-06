/**
 * 引擎错误处理系统
 * 
 * 提供统一的错误类型、错误处理和错误恢复机制
 * 
 * @module errors/engine-error
 */

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  /** 低级别 - 不影响核心功能 */
  LOW = 'low',
  /** 中级别 - 部分功能受影响 */
  MEDIUM = 'medium',
  /** 高级别 - 核心功能受影响 */
  HIGH = 'high',
  /** 严重 - 系统无法正常运行 */
  CRITICAL = 'critical'
}

/**
 * 错误分类
 */
export enum ErrorCategory {
  /** 初始化错误 */
  INITIALIZATION = 'initialization',
  /** 插件错误 */
  PLUGIN = 'plugin',
  /** 状态错误 */
  STATE = 'state',
  /** 事件错误 */
  EVENT = 'event',
  /** 生命周期错误 */
  LIFECYCLE = 'lifecycle',
  /** 中间件错误 */
  MIDDLEWARE = 'middleware',
  /** 未知错误 */
  UNKNOWN = 'unknown'
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 通用错误 (1000-1999)
  UNKNOWN = 1000,
  INVALID_ARGUMENT = 1001,
  NOT_FOUND = 1002,
  ALREADY_EXISTS = 1003,
  PERMISSION_DENIED = 1004,
  
  // 插件错误 (2000-2999)
  PLUGIN_NOT_FOUND = 2000,
  PLUGIN_ALREADY_INSTALLED = 2001,
  PLUGIN_INSTALL_FAILED = 2002,
  PLUGIN_UNINSTALL_FAILED = 2003,
  PLUGIN_DEPENDENCY_MISSING = 2004,
  PLUGIN_CIRCULAR_DEPENDENCY = 2005,
  
  // 状态错误 (3000-3999)
  STATE_NOT_FOUND = 3000,
  STATE_UPDATE_FAILED = 3001,
  STATE_PERSISTENCE_FAILED = 3002,
  
  // 事件错误 (4000-4999)
  EVENT_HANDLER_ERROR = 4000,
  EVENT_EMIT_FAILED = 4001,
  
  // 中间件错误 (5000-5999)
  MIDDLEWARE_ERROR = 5000,
  MIDDLEWARE_CHAIN_BROKEN = 5001,
  
  // 生命周期错误 (6000-6999)
  LIFECYCLE_HOOK_ERROR = 6000,
  
  // 资源错误 (7000-7999)
  RESOURCE_EXHAUSTED = 7000,
  RESOURCE_NOT_AVAILABLE = 7001
}

/**
 * 引擎错误基类
 * 
 * 所有引擎相关错误的基类，提供统一的错误信息格式
 */
export class EngineError extends Error {
  /** 错误代码 */
  readonly code: ErrorCode
  
  /** 错误分类 */
  readonly category: ErrorCategory
  
  /** 错误严重级别 */
  readonly severity: ErrorSeverity
  
  /** 是否可恢复 */
  readonly recoverable: boolean
  
  /** 错误详情 */
  readonly details?: Record<string, unknown>
  
  /** 原始错误 */
  readonly cause?: Error
  
  /** 错误时间戳 */
  readonly timestamp: number

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    options?: {
      category?: ErrorCategory
      severity?: ErrorSeverity
      recoverable?: boolean
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'EngineError'
    this.code = code
    this.category = options?.category ?? ErrorCategory.UNKNOWN
    this.severity = options?.severity ?? ErrorSeverity.MEDIUM
    this.recoverable = options?.recoverable ?? true
    this.details = options?.details
    this.cause = options?.cause
    this.timestamp = Date.now()
    
    // 维护正确的原型链
    Object.setPrototypeOf(this, EngineError.prototype)
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      recoverable: this.recoverable,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    }
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    let str = `${this.name} [${this.code}] (${this.category}/${this.severity}): ${this.message}`
    
    if (this.details) {
      str += `\nDetails: ${JSON.stringify(this.details, null, 2)}`
    }
    
    if (this.cause) {
      str += `\nCaused by: ${this.cause.message}`
    }
    
    str += `\nRecoverable: ${this.recoverable}`
    
    return str
  }
}

/**
 * 插件错误
 */
export class PluginError extends EngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PLUGIN_INSTALL_FAILED,
    options?: {
      severity?: ErrorSeverity
      recoverable?: boolean
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    super(message, code, {
      category: ErrorCategory.PLUGIN,
      severity: options?.severity ?? ErrorSeverity.MEDIUM,
      recoverable: options?.recoverable ?? true,
      details: options?.details,
      cause: options?.cause
    })
    this.name = 'PluginError'
    Object.setPrototypeOf(this, PluginError.prototype)
  }
}

/**
 * 状态错误
 */
export class StateError extends EngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.STATE_UPDATE_FAILED,
    options?: {
      severity?: ErrorSeverity
      recoverable?: boolean
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    super(message, code, {
      category: ErrorCategory.STATE,
      severity: options?.severity ?? ErrorSeverity.HIGH,
      recoverable: options?.recoverable ?? true,
      details: options?.details,
      cause: options?.cause
    })
    this.name = 'StateError'
    Object.setPrototypeOf(this, StateError.prototype)
  }
}

/**
 * 事件错误
 */
export class EventError extends EngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.EVENT_HANDLER_ERROR,
    options?: {
      severity?: ErrorSeverity
      recoverable?: boolean
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    super(message, code, {
      category: ErrorCategory.EVENT,
      severity: options?.severity ?? ErrorSeverity.LOW,
      recoverable: options?.recoverable ?? true,
      details: options?.details,
      cause: options?.cause
    })
    this.name = 'EventError'
    Object.setPrototypeOf(this, EventError.prototype)
  }
}

/**
 * 中间件错误
 */
export class MiddlewareError extends EngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.MIDDLEWARE_ERROR,
    options?: {
      severity?: ErrorSeverity
      recoverable?: boolean
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    super(message, code, {
      category: ErrorCategory.MIDDLEWARE,
      severity: options?.severity ?? ErrorSeverity.MEDIUM,
      recoverable: options?.recoverable ?? true,
      details: options?.details,
      cause: options?.cause
    })
    this.name = 'MiddlewareError'
    Object.setPrototypeOf(this, MiddlewareError.prototype)
  }
}

/**
 * 生命周期错误
 */
export class LifecycleError extends EngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.LIFECYCLE_HOOK_ERROR,
    options?: {
      severity?: ErrorSeverity
      recoverable?: boolean
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    super(message, code, {
      category: ErrorCategory.LIFECYCLE,
      severity: options?.severity ?? ErrorSeverity.HIGH,
      recoverable: options?.recoverable ?? false,
      details: options?.details,
      cause: options?.cause
    })
    this.name = 'LifecycleError'
    Object.setPrototypeOf(this, LifecycleError.prototype)
  }
}

/**
 * 错误处理器类型
 */
export type ErrorHandler = (error: EngineError) => void | Promise<void>

/**
 * 错误管理器
 * 
 * 统一管理错误处理器和错误恢复
 */
export class ErrorManager {
  private handlers: ErrorHandler[] = []
  private errorLog: EngineError[] = []
  private maxLogSize = 100

  /**
   * 注册错误处理器
   * 
   * @param handler - 错误处理器
   * @returns 取消注册函数
   */
  onError(handler: ErrorHandler): () => void {
    this.handlers.push(handler)
    
    return () => {
      const index = this.handlers.indexOf(handler)
      if (index !== -1) {
        this.handlers.splice(index, 1)
      }
    }
  }

  /**
   * 处理错误
   * 
   * @param error - 错误对象
   */
  async handleError(error: EngineError): Promise<void> {
    // 记录错误
    this.errorLog.push(error)
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // 调用所有错误处理器
    for (const handler of this.handlers) {
      try {
        await handler(error)
      } catch (e) {
        console.error('Error in error handler:', e)
      }
    }
  }

  /**
   * 获取错误日志
   * 
   * @param limit - 返回数量限制
   * @returns 错误日志
   */
  getErrorLog(limit?: number): EngineError[] {
    if (limit) {
      return this.errorLog.slice(-limit)
    }
    return [...this.errorLog]
  }

  /**
   * 清空错误日志
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * 设置最大日志大小
   * 
   * @param size - 最大大小
   */
  setMaxLogSize(size: number): void {
    this.maxLogSize = Math.max(1, size)
  }
}

/**
 * 创建错误管理器
 * 
 * @returns 错误管理器实例
 */
export function createErrorManager(): ErrorManager {
  return new ErrorManager()
}

/**
 * 包装函数以捕获并转换错误
 * 
 * @param fn - 要包装的函数
 * @param errorType - 错误类型
 * @returns 包装后的函数
 */
export function wrapError<T extends unknown[], R>(
  fn: (...args: T) => R,
  errorType: typeof EngineError = EngineError
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args)
    } catch (error) {
      if (error instanceof EngineError) {
        throw error
      }
      // 修复：将第三个参数改为 options 对象，正确传递 cause
      throw new errorType(
        error instanceof Error ? error.message : String(error),
        ErrorCode.UNKNOWN,
        {
          cause: error instanceof Error ? error : undefined
        }
      )
    }
  }
}

/**
 * 包装异步函数以捕获并转换错误
 * 
 * @param fn - 要包装的异步函数
 * @param errorType - 错误类型
 * @returns 包装后的异步函数
 */
export function wrapAsyncError<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorType: typeof EngineError = EngineError
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof EngineError) {
        throw error
      }
      // 修复：将第三个参数改为 options 对象，正确传递 cause
      throw new errorType(
        error instanceof Error ? error.message : String(error),
        ErrorCode.UNKNOWN,
        {
          cause: error instanceof Error ? error : undefined
        }
      )
    }
  }
}

/**
 * 错误恢复策略类型
 */
export enum RecoveryStrategy {
  /** 重试操作 */
  RETRY = 'retry',
  /** 回滚到之前状态 */
  ROLLBACK = 'rollback',
  /** 使用默认值 */
  USE_DEFAULT = 'use_default',
  /** 跳过该操作 */
  SKIP = 'skip',
  /** 终止执行 */
  ABORT = 'abort',
  /** 失败 */
  FAIL = 'fail'
}

/**
 * 错误恢复选项
 */
export interface RecoveryOptions {
  /** 恢复策略 */
  strategy: RecoveryStrategy
  /** 重试次数 (仅用于 RETRY 策略) */
  maxRetries?: number
  /** 重试延迟 (毫秒, 仅用于 RETRY 策略) */
  retryDelay?: number
  /** 默认值 (仅用于 USE_DEFAULT 策略) */
  defaultValue?: unknown
  /** 自定义恢复函数 */
  customRecover?: () => void | Promise<void>
}

/**
 * 错误恢复管理器
 */
export class ErrorRecoveryManager {
  private strategies = new Map<ErrorCategory, RecoveryOptions>()
  private recoveryHistory: Array<{
    error: EngineError
    strategy: RecoveryStrategy
    success: boolean
    timestamp: number
  }> = []

  /**
   * 注册错误恢复策略
   * 
   * @param category - 错误分类
   * @param options - 恢复选项
   */
  registerStrategy(category: ErrorCategory, options: RecoveryOptions): void {
    this.strategies.set(category, options)
  }

  /**
   * 尝试从错误中恢复
   * 
   * @param error - 错误对象
   * @returns 是否恢复成功
   */
  async recover(error: EngineError): Promise<boolean> {
    if (!error.recoverable) {
      this.recordRecovery(error, RecoveryStrategy.ABORT, false)
      return false
    }

    const options = this.strategies.get(error.category)
    if (!options) {
      // 没有注册策略，使用默认策略
      return this.defaultRecover(error)
    }

    let success = false
    try {
      switch (options.strategy) {
        case RecoveryStrategy.RETRY:
          success = await this.retryRecover(error, options)
          break
        case RecoveryStrategy.ROLLBACK:
          success = await this.rollbackRecover(error, options)
          break
        case RecoveryStrategy.USE_DEFAULT:
          success = await this.useDefaultRecover(error, options)
          break
        case RecoveryStrategy.SKIP:
          success = true // 跳过即视为成功
          break
        case RecoveryStrategy.ABORT:
          success = false
          break
      }
    } catch (e) {
      console.error('Recovery failed:', e)
      success = false
    }

    this.recordRecovery(error, options.strategy, success)
    return success
  }

  /**
   * 重试恢复策略
   */
  private async retryRecover(
    error: EngineError,
    options: RecoveryOptions
  ): Promise<boolean> {
    const maxRetries = options.maxRetries ?? 3
    const retryDelay = options.retryDelay ?? 1000

    for (let i = 0; i < maxRetries; i++) {
      try {
        if (options.customRecover) {
          await options.customRecover()
          return true
        }
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
      } catch (e) {
        if (i === maxRetries - 1) {
          return false
        }
      }
    }
    return false
  }

  /**
   * 回滚恢复策略
   */
  private async rollbackRecover(
    error: EngineError,
    options: RecoveryOptions
  ): Promise<boolean> {
    try {
      if (options.customRecover) {
        await options.customRecover()
        return true
      }
      // 默认回滚逻辑
      return false
    } catch (e) {
      return false
    }
  }

  /**
   * 使用默认值恢复策略
   */
  private async useDefaultRecover(
    error: EngineError,
    options: RecoveryOptions
  ): Promise<boolean> {
    if (options.defaultValue !== undefined) {
      return true
    }
    return false
  }

  /**
   * 默认恢复策略
   */
  private async defaultRecover(error: EngineError): Promise<boolean> {
    // 根据严重级别决定默认策略
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return true // 低级别错误直接跳过
      case ErrorSeverity.MEDIUM:
        return true // 中级别错误尝试继续
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return false // 高级别错误终止
      default:
        return false
    }
  }

  /**
   * 记录恢复历史
   */
  private recordRecovery(
    error: EngineError,
    strategy: RecoveryStrategy,
    success: boolean
  ): void {
    this.recoveryHistory.push({
      error,
      strategy,
      success,
      timestamp: Date.now()
    })

    // 限制历史记录大小
    if (this.recoveryHistory.length > 100) {
      this.recoveryHistory.shift()
    }
  }

  /**
   * 获取恢复历史
   * 
   * @param limit - 返回数量限制
   */
  getRecoveryHistory(limit?: number) {
    if (limit) {
      return this.recoveryHistory.slice(-limit)
    }
    return [...this.recoveryHistory]
  }

  /**
   * 清空恢复历史
   */
  clearHistory(): void {
    this.recoveryHistory = []
  }

  /**
   * 获取恢复成功率
   * 
   * @param category - 可选的错误分类过滤
   */
  getSuccessRate(category?: ErrorCategory): number {
    let filtered = this.recoveryHistory
    if (category) {
      filtered = filtered.filter(record => record.error.category === category)
    }

    if (filtered.length === 0) return 0

    const successCount = filtered.filter(record => record.success).length
    return successCount / filtered.length
  }
}

/**
 * 创建错误恢复管理器
 */
export function createErrorRecoveryManager(): ErrorRecoveryManager {
  return new ErrorRecoveryManager()
}