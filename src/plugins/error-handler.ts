import type { Engine, ErrorHandler, Plugin } from '../types'

/**
 * 错误信息接口
 */
interface ErrorInfo {
  error: Error
  context?: any
  timestamp: number
  stack?: string
  userAgent?: string
  url?: string
  component?: string
  hook?: string
}

/**
 * 错误统计接口
 */
interface ErrorStats {
  total: number
  byType: Record<string, number>
  byComponent: Record<string, number>
  byHook: Record<string, number>
  recent: ErrorInfo[]
}

/**
 * 错误恢复策略
 */
type RecoveryStrategy = 'ignore' | 'retry' | 'fallback' | 'reload'

/**
 * 错误处理器配置
 */
interface ErrorHandlerConfig {
  enabled?: boolean
  captureUnhandledRejections?: boolean
  captureUnhandledErrors?: boolean
  maxErrors?: number
  enableRecovery?: boolean
  defaultRecoveryStrategy?: RecoveryStrategy
  reportToConsole?: boolean
  reportToServer?: boolean
  serverEndpoint?: string
}

/**
 * 错误处理器实现
 */
export class ErrorHandlerImpl {
  private errors: ErrorInfo[] = []
  private errorHandlers = new Map<string, ErrorHandler>()
  private recoveryStrategies = new Map<string, RecoveryStrategy>()
  private config: Required<ErrorHandlerConfig>
  private originalErrorHandler?: OnErrorEventHandler
  private originalUnhandledRejectionHandler?: ((ev: PromiseRejectionEvent) => any) | null

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      captureUnhandledRejections: config.captureUnhandledRejections ?? true,
      captureUnhandledErrors: config.captureUnhandledErrors ?? true,
      maxErrors: config.maxErrors ?? 100,
      enableRecovery: config.enableRecovery ?? true,
      defaultRecoveryStrategy: config.defaultRecoveryStrategy ?? 'ignore',
      reportToConsole: config.reportToConsole ?? true,
      reportToServer: config.reportToServer ?? false,
      serverEndpoint: config.serverEndpoint ?? '',
    }

    if (this.config.enabled) {
      this.setupGlobalErrorHandling()
    }
  }

  /**
   * 处理错误
   */
  handleError(error: Error, context?: any): void {
    if (!this.config.enabled) {
      return
    }

    const errorInfo: ErrorInfo = {
      error,
      context,
      timestamp: Date.now(),
      stack: error.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      component: context?.component,
      hook: context?.hook,
    }

    // 添加到错误列表
    this.addError(errorInfo)

    // 报告错误
    this.reportError(errorInfo)

    // 尝试恢复
    if (this.config.enableRecovery) {
      this.attemptRecovery(errorInfo)
    }

    // 调用自定义错误处理器
    this.callCustomHandlers(errorInfo)
  }

  /**
   * 注册错误处理器
   */
  registerHandler(name: string, handler: ErrorHandler): void {
    this.errorHandlers.set(name, handler)
  }

  /**
   * 移除错误处理器
   */
  unregisterHandler(name: string): void {
    this.errorHandlers.delete(name)
  }

  /**
   * 设置恢复策略
   */
  setRecoveryStrategy(errorType: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy)
  }

  /**
   * 获取错误统计
   */
  getStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errors.length,
      byType: {},
      byComponent: {},
      byHook: {},
      recent: this.errors.slice(-10),
    }

    for (const errorInfo of this.errors) {
      const errorType = errorInfo.error.constructor.name
      stats.byType[errorType] = (stats.byType[errorType] || 0) + 1

      if (errorInfo.component) {
        stats.byComponent[errorInfo.component] = (stats.byComponent[errorInfo.component] || 0) + 1
      }

      if (errorInfo.hook) {
        stats.byHook[errorInfo.hook] = (stats.byHook[errorInfo.hook] || 0) + 1
      }
    }

    return stats
  }

  /**
   * 清除错误历史
   */
  clearErrors(): void {
    this.errors.length = 0
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(count = 10): ErrorInfo[] {
    return this.errors.slice(-count)
  }

  /**
   * 检查是否有错误
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * 添加错误到列表
   */
  private addError(errorInfo: ErrorInfo): void {
    this.errors.push(errorInfo)

    // 限制错误数量
    if (this.errors.length > this.config.maxErrors) {
      this.errors.shift()
    }
  }

  /**
   * 报告错误
   */
  private reportError(errorInfo: ErrorInfo): void {
    // 控制台报告
    if (this.config.reportToConsole) {
      console.error('Engine Error:', errorInfo.error)
      if (errorInfo.context) {
        console.error('Context:', errorInfo.context)
      }
    }

    // 服务器报告
    if (this.config.reportToServer && this.config.serverEndpoint) {
      this.reportToServer(errorInfo).catch((err) => {
        console.warn('Failed to report error to server:', err)
      })
    }
  }

  /**
   * 向服务器报告错误
   */
  private async reportToServer(errorInfo: ErrorInfo): Promise<void> {
    try {
      const payload = {
        message: errorInfo.error.message,
        stack: errorInfo.stack,
        timestamp: errorInfo.timestamp,
        userAgent: errorInfo.userAgent,
        url: errorInfo.url,
        component: errorInfo.component,
        hook: errorInfo.hook,
        context: errorInfo.context,
      }

      await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    }
 catch (error) {
      // 静默失败，避免无限循环
    }
  }

  /**
   * 尝试错误恢复
   */
  private attemptRecovery(errorInfo: ErrorInfo): void {
    const errorType = errorInfo.error.constructor.name
    const strategy = this.recoveryStrategies.get(errorType) || this.config.defaultRecoveryStrategy

    switch (strategy) {
      case 'ignore':
        // 什么都不做
        break

      case 'retry':
        // 如果有重试上下文，尝试重试
        if (errorInfo.context?.retry && typeof errorInfo.context.retry === 'function') {
          setTimeout(() => {
            try {
              errorInfo.context.retry()
            }
 catch (retryError) {
              console.warn('Retry failed:', retryError)
            }
          }, 1000)
        }
        break

      case 'fallback':
        // 如果有回退函数，执行回退
        if (errorInfo.context?.fallback && typeof errorInfo.context.fallback === 'function') {
          try {
            errorInfo.context.fallback()
          }
 catch (fallbackError) {
            console.warn('Fallback failed:', fallbackError)
          }
        }
        break

      case 'reload':
        // 重新加载页面（仅在浏览器环境）
        if (typeof window !== 'undefined' && window.location) {
          console.warn('Critical error detected, reloading page...')
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
        break
    }
  }

  /**
   * 调用自定义错误处理器
   */
  private callCustomHandlers(errorInfo: ErrorInfo): void {
    for (const [name, handler] of this.errorHandlers) {
      try {
        handler(errorInfo.error, errorInfo.context)
      }
 catch (handlerError) {
        console.error(`Error in custom error handler '${name}':`, handlerError)
      }
    }
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') {
      return
    }

    // 捕获未处理的错误
    if (this.config.captureUnhandledErrors) {
      this.originalErrorHandler = window.onerror
      window.onerror = (message, source, lineno, colno, error) => {
        if (error) {
          this.handleError(error, {
            source,
            lineno,
            colno,
            type: 'unhandled',
          })
        }
 else {
          this.handleError(new Error(String(message)), {
            source,
            lineno,
            colno,
            type: 'unhandled',
          })
        }

        // 调用原始处理器
        if (this.originalErrorHandler && typeof this.originalErrorHandler === 'function') {
          return this.originalErrorHandler.call(window, message, source, lineno, colno, error)
        }
        return false
      }
    }

    // 捕获未处理的Promise拒绝
    if (this.config.captureUnhandledRejections) {
      this.originalUnhandledRejectionHandler = window.onunhandledrejection
      window.onunhandledrejection = (event) => {
        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason))

        this.handleError(error, {
          type: 'unhandledRejection',
          promise: event.promise,
        })

        // 调用原始处理器
         if (this.originalUnhandledRejectionHandler && typeof this.originalUnhandledRejectionHandler === 'function') {
           this.originalUnhandledRejectionHandler(event)
         }
      }
    }
  }

  /**
   * 恢复全局错误处理
   */
  private restoreGlobalErrorHandling(): void {
    if (typeof window === 'undefined') {
      return
    }

    if (this.originalErrorHandler !== undefined) {
      window.onerror = this.originalErrorHandler
      this.originalErrorHandler = undefined
    }

    if (this.originalUnhandledRejectionHandler !== undefined) {
      window.onunhandledrejection = this.originalUnhandledRejectionHandler
      this.originalUnhandledRejectionHandler = undefined
    }
  }

  /**
   * 销毁错误处理器
   */
  destroy(): void {
    this.restoreGlobalErrorHandling()
    this.clearErrors()
    this.errorHandlers.clear()
    this.recoveryStrategies.clear()
  }
}

/**
 * 错误处理插件
 */
export const errorHandlerPlugin: Plugin = {
  name: 'error-handler',
  install(engine: Engine, options: ErrorHandlerConfig = {}) {
    const errorHandler = new ErrorHandlerImpl(options)

    // 注入错误处理器
    engine.provide('errorHandler', errorHandler)

    // 设置引擎错误处理器
    if (engine.updateConfig) {
      engine.updateConfig({
        errorHandler: (error: Error, context?: any) => {
          errorHandler.handleError(error, context)
        },
      })
    }

    // 监听引擎错误事件
    engine.on('engine:error', (error: Error, context?: any) => {
      errorHandler.handleError(error, { ...context, source: 'engine' })
    })

    engine.on('plugin:error', (error: Error, context?: any) => {
      errorHandler.handleError(error, { ...context, source: 'plugin' })
    })

    engine.on('middleware:error', (error: Error, context?: any) => {
      errorHandler.handleError(error, { ...context, source: 'middleware' })
    })

    // 添加错误处理API到引擎
    Object.assign(engine, {
      handleError: (error: Error, context?: any) => errorHandler.handleError(error, context),
      registerErrorHandler: (name: string, handler: ErrorHandler) =>
        errorHandler.registerHandler(name, handler),
      unregisterErrorHandler: (name: string) => errorHandler.unregisterHandler(name),
      setRecoveryStrategy: (errorType: string, strategy: RecoveryStrategy) =>
        errorHandler.setRecoveryStrategy(errorType, strategy),
      getErrorStats: () => errorHandler.getStats(),
      clearErrors: () => errorHandler.clearErrors(),
    })
  },

  uninstall(engine: Engine) {
    const errorHandler = engine.inject<ErrorHandlerImpl>('errorHandler')
    if (errorHandler) {
      errorHandler.destroy()
    }
  },
}
