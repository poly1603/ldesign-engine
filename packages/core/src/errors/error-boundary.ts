/**
 * 错误边界模块
 *
 * 提供统一的错误边界装饰器、错误上下文链追踪和全局错误监控
 *
 * @module errors/error-boundary
 */

import {
  EngineError,
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  type ErrorHandler,
} from './engine-error'

/**
 * 错误上下文信息
 */
export interface ErrorContext {
  /** 操作名称 */
  operation: string
  /** 模块名称 */
  module?: string
  /** 额外数据 */
  data?: Record<string, unknown>
  /** 时间戳 */
  timestamp: number
  /** 父上下文 */
  parent?: ErrorContext
}

/**
 * 错误边界配置
 */
export interface ErrorBoundaryConfig {
  /** 是否捕获错误（不抛出） */
  captureError?: boolean
  /** 默认返回值（捕获错误时使用） */
  defaultValue?: unknown
  /** 错误转换函数 */
  transform?: (error: Error, context: ErrorContext) => EngineError
  /** 错误处理器 */
  onError?: ErrorHandler
  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxAttempts: number
    /** 重试延迟（毫秒） */
    delay?: number
    /** 延迟倍数（指数退避） */
    backoffMultiplier?: number
    /** 可重试的错误代码 */
    retryableCodes?: ErrorCode[]
  }
}

/**
 * 错误上下文栈
 *
 * 用于追踪错误发生的调用链
 */
class ErrorContextStack {
  private stack: ErrorContext[] = []

  /**
   * 推入上下文
   */
  push(context: Omit<ErrorContext, 'timestamp' | 'parent'>): void {
    const parent = this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined
    this.stack.push({
      ...context,
      timestamp: Date.now(),
      parent
    })
  }

  /**
   * 弹出上下文
   */
  pop(): ErrorContext | undefined {
    return this.stack.pop()
  }

  /**
   * 获取当前上下文
   */
  current(): ErrorContext | undefined {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined
  }

  /**
   * 获取完整上下文链
   */
  getChain(): ErrorContext[] {
    return [...this.stack]
  }

  /**
   * 清空栈
   */
  clear(): void {
    this.stack.length = 0
  }
}

// 全局错误上下文栈
const globalContextStack = new ErrorContextStack()

/**
 * 全局错误监控器
 *
 * 集中管理错误处理器和错误日志
 */
export class GlobalErrorMonitor {
  private static instance: GlobalErrorMonitor | null = null
  private handlers: ErrorHandler[] = []
  private errorLog: Array<{ error: EngineError; context?: ErrorContext }> = []
  private maxLogSize = 100
  private enabled = true

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): GlobalErrorMonitor {
    if (!GlobalErrorMonitor.instance) {
      GlobalErrorMonitor.instance = new GlobalErrorMonitor()
    }
    return GlobalErrorMonitor.instance
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    if (GlobalErrorMonitor.instance) {
      GlobalErrorMonitor.instance.clear()
    }
    GlobalErrorMonitor.instance = null
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 注册错误处理器
   *
   * @param handler - 错误处理器
   * @returns 取消注册函数
   */
  addHandler(handler: ErrorHandler): () => void {
    this.handlers.push(handler)
    return () => {
      const index = this.handlers.indexOf(handler)
      if (index !== -1) {
        this.handlers.splice(index, 1)
      }
    }
  }

  /**
   * 报告错误
   *
   * @param error - 错误对象
   * @param context - 错误上下文
   */
  async report(error: EngineError, context?: ErrorContext): Promise<void> {
    if (!this.enabled) return

    // 记录错误
    this.errorLog.push({ error, context })
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // 调用所有处理器
    for (const handler of this.handlers) {
      try {
        await handler(error)
      } catch (e) {
        console.error('[GlobalErrorMonitor] Handler error:', e)
      }
    }
  }

  /**
   * 获取错误日志
   *
   * @param limit - 返回数量限制
   */
  getLog(limit?: number): Array<{ error: EngineError; context?: ErrorContext }> {
    if (limit) {
      return this.errorLog.slice(-limit)
    }
    return [...this.errorLog]
  }

  /**
   * 获取错误统计
   */
  getStats(): {
    total: number
    byCategory: Record<string, number>
    bySeverity: Record<string, number>
    byCode: Record<number, number>
  } {
    const byCategory: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    const byCode: Record<number, number> = {}

    for (const { error } of this.errorLog) {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
      byCode[error.code] = (byCode[error.code] || 0) + 1
    }

    return {
      total: this.errorLog.length,
      byCategory,
      bySeverity,
      byCode
    }
  }

  /**
   * 清空日志和处理器
   */
  clear(): void {
    this.errorLog.length = 0
    this.handlers.length = 0
  }

  /**
   * 设置最大日志大小
   */
  setMaxLogSize(size: number): void {
    this.maxLogSize = Math.max(1, size)
  }
}

/**
 * 将普通错误转换为 EngineError
 *
 * @param error - 原始错误
 * @param context - 错误上下文
 * @returns EngineError
 */
export function toEngineError(error: unknown, context?: ErrorContext): EngineError {
  if (error instanceof EngineError) {
    // 添加上下文信息
    if (context) {
      (error as EngineError & { context?: ErrorContext }).context = context
    }
    return error
  }

  const message = error instanceof Error ? error.message : String(error)
  const cause = error instanceof Error ? error : undefined

  // 根据上下文推断错误分类
  let category = ErrorCategory.UNKNOWN
  if (context?.module) {
    const moduleMap: Record<string, ErrorCategory> = {
      'plugin': ErrorCategory.PLUGIN,
      'state': ErrorCategory.STATE,
      'event': ErrorCategory.EVENT,
      'lifecycle': ErrorCategory.LIFECYCLE,
      'middleware': ErrorCategory.MIDDLEWARE
    }
    category = moduleMap[context.module.toLowerCase()] || ErrorCategory.UNKNOWN
  }

  return new EngineError(message, ErrorCode.UNKNOWN, {
    category,
    severity: ErrorSeverity.MEDIUM,
    cause,
    details: context?.data
  })
}

/**
 * 创建带有上下文的错误边界包装器
 *
 * @param operation - 操作名称
 * @param module - 模块名称
 * @param config - 配置
 */
export function withErrorBoundary<T extends (...args: unknown[]) => unknown>(
  fn: T,
  operation: string,
  module?: string,
  config?: ErrorBoundaryConfig
): T {
  const boundaryFn = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
    const context: Omit<ErrorContext, 'timestamp' | 'parent'> = {
      operation,
      module,
      data: { args }
    }

    globalContextStack.push(context)

    try {
      return await executeWithRetry(
        () => fn.apply(this, args),
        config?.retry
      )
    } catch (error) {
      const engineError = config?.transform
        ? config.transform(error as Error, globalContextStack.current()!)
        : toEngineError(error, globalContextStack.current())

      // 报告错误
      await GlobalErrorMonitor.getInstance().report(
        engineError,
        globalContextStack.current()
      )

      // 调用自定义错误处理器
      if (config?.onError) {
        await config.onError(engineError)
      }

      // 根据配置决定是否抛出
      if (config?.captureError) {
        return config.defaultValue
      }

      throw engineError
    } finally {
      globalContextStack.pop()
    }
  }

  return boundaryFn as T
}

/**
 * 带重试的执行函数
 */
async function executeWithRetry<T>(
  fn: () => T | Promise<T>,
  retryConfig?: ErrorBoundaryConfig['retry']
): Promise<T> {
  if (!retryConfig) {
    return await fn()
  }

  const { maxAttempts, delay = 1000, backoffMultiplier = 2, retryableCodes } = retryConfig
  let lastError: Error | undefined
  let currentDelay = delay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 检查是否可重试
      if (error instanceof EngineError && retryableCodes) {
        if (!retryableCodes.includes(error.code)) {
          throw error
        }
      }

      // 最后一次尝试，直接抛出
      if (attempt === maxAttempts) {
        throw lastError
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoffMultiplier
    }
  }

  throw lastError
}

/**
 * 错误边界装饰器
 *
 * @param operation - 操作名称
 * @param config - 配置
 *
 * @example
 * ```typescript
 * class PluginManager {
 *   @errorBoundary('install', { module: 'plugin' })
 *   async install(plugin: Plugin): Promise<void> {
 *     // ...
 *   }
 * }
 * ```
 */
export function errorBoundary(operation: string, config?: ErrorBoundaryConfig & { module?: string }) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = withErrorBoundary(
      originalMethod,
      operation,
      config?.module,
      config
    ) as T

    return descriptor
  }
}

/**
 * 安全执行函数
 *
 * 捕获所有错误并返回 Result 类型
 *
 * @example
 * ```typescript
 * const result = await safeExecute(
 *   () => riskyOperation(),
 *   'riskyOperation'
 * )
 *
 * if (result.success) {
 *   console.log(result.value)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  operation: string,
  module?: string
): Promise<{ success: true; value: T } | { success: false; error: EngineError }> {
  const context: Omit<ErrorContext, 'timestamp' | 'parent'> = {
    operation,
    module
  }

  globalContextStack.push(context)

  try {
    const value = await fn()
    return { success: true, value }
  } catch (error) {
    const engineError = toEngineError(error, globalContextStack.current())
    await GlobalErrorMonitor.getInstance().report(engineError, globalContextStack.current())
    return { success: false, error: engineError }
  } finally {
    globalContextStack.pop()
  }
}

/**
 * 断言函数
 *
 * 如果条件为 false，抛出 EngineError
 *
 * @example
 * ```typescript
 * assertCondition(
 *   user !== null,
 *   'User must be logged in',
 *   ErrorCode.PERMISSION_DENIED
 * )
 * ```
 */
export function assertCondition(
  condition: boolean,
  message: string,
  code: ErrorCode = ErrorCode.INVALID_ARGUMENT,
  options?: {
    category?: ErrorCategory
    severity?: ErrorSeverity
    details?: Record<string, unknown>
  }
): asserts condition {
  if (!condition) {
    throw new EngineError(message, code, {
      category: options?.category ?? ErrorCategory.UNKNOWN,
      severity: options?.severity ?? ErrorSeverity.MEDIUM,
      details: options?.details
    })
  }
}

/**
 * 断言值不为 null 或 undefined
 *
 * @example
 * ```typescript
 * const plugin = assertDefined(
 *   plugins.get(name),
 *   `Plugin "${name}" not found`,
 *   ErrorCode.PLUGIN_NOT_FOUND
 * )
 * ```
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
  code: ErrorCode = ErrorCode.NOT_FOUND
): T {
  if (value === null || value === undefined) {
    throw new EngineError(message, code, {
      severity: ErrorSeverity.MEDIUM
    })
  }
  return value
}

/**
 * 获取当前错误上下文链
 */
export function getCurrentContextChain(): ErrorContext[] {
  return globalContextStack.getChain()
}

/**
 * 清空错误上下文栈
 */
export function clearContextStack(): void {
  globalContextStack.clear()
}

/**
 * 创建错误聚合器
 *
 * 用于收集多个操作的错误，最后统一处理
 *
 * @example
 * ```typescript
 * const aggregator = createErrorAggregator()
 *
 * await aggregator.tryExecute(() => op1())
 * await aggregator.tryExecute(() => op2())
 * await aggregator.tryExecute(() => op3())
 *
 * if (aggregator.hasErrors()) {
 *   console.error('Some operations failed:', aggregator.getErrors())
 * }
 * ```
 */
export function createErrorAggregator() {
  const errors: EngineError[] = []

  return {
    /**
     * 尝试执行操作，捕获错误
     */
    async tryExecute<T>(fn: () => T | Promise<T>, operation?: string): Promise<T | undefined> {
      try {
        return await fn()
      } catch (error) {
        const engineError = toEngineError(error, operation ? {
          operation,
          timestamp: Date.now()
        } : undefined)
        errors.push(engineError)
        return undefined
      }
    },

    /**
     * 是否有错误
     */
    hasErrors(): boolean {
      return errors.length > 0
    },

    /**
     * 获取所有错误
     */
    getErrors(): EngineError[] {
      return [...errors]
    },

    /**
     * 获取错误数量
     */
    errorCount(): number {
      return errors.length
    },

    /**
     * 如果有错误则抛出聚合错误
     */
    throwIfErrors(message?: string): void {
      if (errors.length > 0) {
        const aggregateMessage = message || `${errors.length} error(s) occurred`
        throw new EngineError(aggregateMessage, ErrorCode.UNKNOWN, {
          severity: ErrorSeverity.HIGH,
          details: {
            errors: errors.map(e => e.toJSON())
          }
        })
      }
    },

    /**
     * 清空错误
     */
    clear(): void {
      errors.length = 0
    }
  }
}
