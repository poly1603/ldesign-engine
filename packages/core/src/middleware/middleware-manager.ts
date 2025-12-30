/**
 * 中间件管理器实现
 *
 * 提供类似 Koa/Express 的中间件系统,支持洋葱模型
 *
 * @module middleware-manager
 */

import type {
  Middleware,
  MiddlewareContext,
  MiddlewareManager,
} from '../types'
import type { ContextData } from '../types/common'

/**
 * 核心中间件管理器
 *
 * 特性:
 * - 洋葱模型中间件链
 * - 优先级排序
 * - 错误处理
 * - 中间件取消
 * - 性能优化
 *
 * @example
 * ```typescript
 * const middlewareManager = createMiddlewareManager()
 *
 * // 注册中间件
 * middlewareManager.use({
 *   name: 'logger',
 *   priority: 100,
 *   async execute(ctx, next) {
 *     console.log('Before:', ctx.data)
 *     await next()
 *     console.log('After:', ctx.data)
 *   }
 * })
 *
 * // 执行中间件链
 * await middlewareManager.execute({
 *   data: { message: 'Hello' },
 *   cancelled: false
 * })
 * ```
 */
export class CoreMiddlewareManager implements MiddlewareManager {
  /** 中间件存储 - 使用 Map 保证插入顺序 */
  private middlewares = new Map<string, Middleware>()

  /** 排序后的中间件缓存 - 性能优化 */
  private sortedCache: Middleware[] | null = null

  /**
   * 注册中间件
   *
   * 性能优化:
   * - 如果优先级相同，只更新引用，不清除缓存
   * - 优先级变化时才清除缓存
   *
   * @param middleware - 中间件对象
   *
   * @example
   * ```typescript
   * middlewareManager.use({
   *   name: 'auth',
   *   priority: 90,
   *   async execute(ctx, next) {
   *     if (!ctx.user) {
   *       ctx.cancelled = true
   *       return
   *     }
   *     await next()
   *   }
   * })
   * ```
   */
  use(middleware: Middleware): void {
    const existed = this.middlewares.has(middleware.name)

    if (existed) {
      const oldMiddleware = this.middlewares.get(middleware.name)!

      // 性能优化：如果优先级相同，不需要重新排序
      if (oldMiddleware.priority === middleware.priority) {
        this.middlewares.set(middleware.name, middleware)

        // 更新缓存中的引用（如果缓存存在）
        if (this.sortedCache) {
          const index = this.sortedCache.findIndex(m => m.name === middleware.name)
          if (index !== -1) {
            this.sortedCache[index] = middleware
          }
        }
        return
      }

      console.warn(`Middleware "${middleware.name}" already registered, replacing...`)
    }

    this.middlewares.set(middleware.name, middleware)

    // 只有在优先级变化或新增时才清除缓存
    this.sortedCache = null
  }

  /**
   * 移除中间件
   *
   * 性能优化: 直接从缓存中移除，而不是清空整个缓存
   *
   * @param name - 中间件名称
   * @returns 是否移除成功
   *
   * @example
   * ```typescript
   * middlewareManager.remove('auth')
   * ```
   */
  remove(name: string): boolean {
    if (!this.middlewares.has(name)) {
      return false
    }

    const result = this.middlewares.delete(name)

    if (result && this.sortedCache) {
      // 性能优化：直接从缓存中移除，而不是清空整个缓存
      const index = this.sortedCache.findIndex(m => m.name === name)
      if (index !== -1) {
        this.sortedCache.splice(index, 1)
      }
    }

    return result
  }

  /**
   * 获取中间件
   *
   * @param name - 中间件名称
   * @returns 中间件对象
   *
   * @example
   * ```typescript
   * const authMiddleware = middlewareManager.get('auth')
   * ```
   */
  get(name: string): Middleware | undefined {
    return this.middlewares.get(name)
  }

  /**
   * 获取所有中间件
   *
   * @returns 中间件数组
   *
   * @example
   * ```typescript
   * const all = middlewareManager.getAll()
   * console.log('Middleware count:', all.length)
   * ```
   */
  getAll(): Middleware[] {
    return Array.from(this.middlewares.values())
  }

  /**
   * 执行中间件链
   *
   * 实现洋葱模型:
   * 1. 按优先级从高到低执行中间件
   * 2. 每个中间件可以调用 next() 继续执行下一个
   * 3. next() 之后的代码在后续中间件执行完后执行
   *
   * 性能优化:
   * - 缓存排序后的中间件列表
   * - 支持中间件取消
   * - 错误隔离
   *
   * @param context - 中间件上下文
   *
   * @example
   * ```typescript
   * const context = {
   *   data: { userId: 1 },
   *   cancelled: false
   * }
   *
   * await middlewareManager.execute(context)
   *
   * if (!context.cancelled) {
   *   console.log('All middleware executed successfully')
   * }
   * ```
   */
  async execute<T = ContextData>(context: MiddlewareContext<T>): Promise<void> {
    // 性能优化: 使用缓存的排序结果
    if (!this.sortedCache) {
      this.sortedCache = this.getSortedMiddlewares()
    }

    const sortedMiddlewares = this.sortedCache

    // 性能优化: 没有中间件时快速返回
    if (sortedMiddlewares.length === 0) {
      return
    }

    let index = 0

    /**
     * 调度函数 - 执行下一个中间件
     *
     * 洋葱模型实现:
     * - 每次调用 next() 执行下一个中间件
     * - 中间件可以在 next() 前后执行代码
     * - 支持异步操作
     */
    const dispatch = async (): Promise<void> => {
      // 检查是否已取消
      if (context.cancelled) {
        return
      }

      // 检查是否已执行完所有中间件
      if (index >= sortedMiddlewares.length) {
        return
      }

      const middleware = sortedMiddlewares[index++]

      try {
        // 执行中间件,传入 dispatch 作为 next 函数
        await middleware.execute(context, dispatch)
      } catch (error) {
        // 修复：错误处理 - 捕获错误处理器异常，标记上下文但不中断链
        if (middleware.onError) {
          try {
            await middleware.onError(error as Error, context)
            // 错误已被处理，继续执行后续中间件
          } catch (handlerError) {
            // 修复：错误处理器本身出错，记录错误但不中断整个链
            console.error(
              `Error in middleware "${middleware.name}" error handler:`,
              handlerError
            )
          // 标记上下文有错误，但允许其他中间件继续执行
            const ctxWithError = context as MiddlewareContext<T> & { error?: Error }
            if (!ctxWithError.error) {
              ctxWithError.error = handlerError as Error
            }
            // 不再抛出，允许链继续
          }
        } else {
          // 没有错误处理器，记录错误并标记上下文
          console.error(`Error in middleware "${middleware.name}":`, error)
          const ctxWithError = context as MiddlewareContext<T> & { error?: Error }
          if (!ctxWithError.error) {
            ctxWithError.error = error as Error
          }
          // 不中断链，让后续中间件有机会处理或清理
        }
        
        // 修复：错误发生后继续执行后续中间件（错误隔离）
        await dispatch()
      }
    }

    // 开始执行中间件链
    await dispatch()
  }

  /**
   * 清空所有中间件
   *
   * @example
   * ```typescript
   * middlewareManager.clear()
   * ```
   */
  clear(): void {
    this.middlewares.clear()
    this.sortedCache = null
  }

  /**
   * 获取中间件数量
   *
   * @returns 中间件数量
   *
   * @example
   * ```typescript
   * const count = middlewareManager.size()
   * console.log(`${count} middleware registered`)
   * ```
   */
  size(): number {
    return this.middlewares.size
  }

  /**
   * 检查中间件是否存在
   *
   * @param name - 中间件名称
   * @returns 是否存在
   *
   * @example
   * ```typescript
   * if (middlewareManager.has('auth')) {
   *   console.log('Auth middleware is registered')
   * }
   * ```
   */
  has(name: string): boolean {
    return this.middlewares.has(name)
  }

  /**
   * 获取排序后的中间件列表 (内部方法)
   *
   * 排序规则:
   * - 按 priority 降序排列(数值越大优先级越高)
   * - priority 相同时保持注册顺序
   *
   * @returns 排序后的中间件数组
   * @private
   */
  private getSortedMiddlewares(): Middleware[] {
    const middlewares = this.getAll()

    // 按优先级排序(降序)
    return middlewares.sort((a, b) => {
      const priorityA = a.priority ?? 0
      const priorityB = b.priority ?? 0
      return priorityB - priorityA
    })
  }
}

/**
 * 创建中间件管理器实例
 *
 * @returns 中间件管理器实例
 *
 * @example
 * ```typescript
 * import { createMiddlewareManager } from '@ldesign/engine-core'
 *
 * const middlewareManager = createMiddlewareManager()
 * ```
 */
export function createMiddlewareManager(): MiddlewareManager {
  return new CoreMiddlewareManager()
}

/**
 * 条件中间件配置
 */
export interface ConditionalMiddlewareConfig<T = ContextData> {
  /** 中间件名称 */
  name: string
  /** 条件函数 - 返回 true 时执行中间件 */
  condition: (context: MiddlewareContext<T>) => boolean | Promise<boolean>
  /** 执行函数 */
  execute: Middleware['execute']
  /** 优先级 */
  priority?: number
  /** 错误处理 */
  onError?: Middleware['onError']
}

/**
 * 创建条件中间件
 *
 * 只有当条件满足时才执行的中间件
 *
 * @param config - 条件中间件配置
 * @returns 中间件对象
 *
 * @example
 * ```typescript
 * const authMiddleware = createConditionalMiddleware({
 *   name: 'auth',
 *   condition: (ctx) => ctx.data.requiresAuth === true,
 *   execute: async (ctx, next) => {
 *     if (!ctx.user) {
 *       ctx.cancelled = true
 *       return
 *     }
 *     await next()
 *   }
 * })
 * ```
 */
export function createConditionalMiddleware<T = ContextData>(
  config: ConditionalMiddlewareConfig<T>
): Middleware {
  return {
    name: config.name,
    priority: config.priority ?? 0,
    onError: config.onError,
    async execute(context, next) {
      const shouldExecute = await config.condition(context as MiddlewareContext<T>)

      if (shouldExecute) {
        await config.execute(context, next)
      } else {
        // 跳过当前中间件，继续执行下一个
        await next()
      }
    }
  }
}

/**
 * 组合多个中间件为一个
 *
 * @param middlewares - 中间件数组
 * @param name - 组合后的中间件名称
 * @param priority - 组合后的优先级
 * @returns 组合后的中间件
 *
 * @example
 * ```typescript
 * const composed = composeMiddleware(
 *   [loggerMiddleware, authMiddleware, validationMiddleware],
 *   'request-pipeline',
 *   100
 * )
 *
 * middlewareManager.use(composed)
 * ```
 */
export function composeMiddleware(
  middlewares: Middleware[],
  name: string,
  priority: number = 0
): Middleware {
  return {
    name,
    priority,
    async execute(context, next) {
      // 按优先级排序
      const sorted = [...middlewares].sort((a, b) => {
        const priorityA = a.priority ?? 0
        const priorityB = b.priority ?? 0
        return priorityB - priorityA
      })

      let index = 0

      const dispatch = async (): Promise<void> => {
        if (context.cancelled) {
          return
        }

        if (index >= sorted.length) {
          // 所有内部中间件执行完毕，调用外部 next
          await next()
          return
        }

        const middleware = sorted[index++]

        try {
          await middleware.execute(context, dispatch)
        } catch (error) {
          if (middleware.onError) {
            await middleware.onError(error as Error, context)
          } else {
            throw error
          }
        }
      }

      await dispatch()
    }
  }
}

/**
 * 短路控制标记
 */
export const SHORT_CIRCUIT = Symbol('SHORT_CIRCUIT')

/**
 * 创建可短路的中间件管理器
 *
 * 支持通过返回特定值来立即终止中间件链
 *
 * @example
 * ```typescript
 * const manager = createShortCircuitMiddlewareManager()
 *
 * manager.use({
 *   name: 'cache',
 *   execute: async (ctx, next) => {
 *     const cached = cache.get(ctx.data.key)
 *     if (cached) {
 *       ctx.result = cached
 *       return SHORT_CIRCUIT // 立即终止，不执行后续中间件
 *     }
 *     await next()
 *   }
 * })
 * ```
 */
export class ShortCircuitMiddlewareManager extends CoreMiddlewareManager {
  async execute<T = ContextData>(context: MiddlewareContext<T>): Promise<void> {
    // 获取排序后的中间件
    const sortedMiddlewares = this.getAll().sort((a, b) => {
      const priorityA = a.priority ?? 0
      const priorityB = b.priority ?? 0
      return priorityB - priorityA
    })

    if (sortedMiddlewares.length === 0) {
      return
    }

    let index = 0
    let shortCircuited = false

    const dispatch = async (): Promise<unknown> => {
      if (context.cancelled || shortCircuited) {
        return
      }

      if (index >= sortedMiddlewares.length) {
        return
      }

      const middleware = sortedMiddlewares[index++]

      try {
        const result = await middleware.execute(context, dispatch)

        // 检查短路标记
        if (result === SHORT_CIRCUIT) {
          shortCircuited = true
          return
        }

        return result
      } catch (error) {
        if (middleware.onError) {
          try {
            await middleware.onError(error as Error, context)
          } catch (handlerError) {
            console.error(
              `Error in middleware "${middleware.name}" error handler:`,
              handlerError
            )
          }
        } else {
          console.error(`Error in middleware "${middleware.name}":`, error)
        }

        // 继续执行后续中间件
        return dispatch()
      }
    }

    await dispatch()
  }
}

/**
 * 创建短路中间件管理器
 *
 * @returns 短路中间件管理器实例
 */
export function createShortCircuitMiddlewareManager(): ShortCircuitMiddlewareManager {
  return new ShortCircuitMiddlewareManager()
}

/**
 * 中间件构建器
 *
 * 提供流式 API 构建中间件
 *
 * @example
 * ```typescript
 * const middleware = new MiddlewareBuilder('my-middleware')
 *   .priority(50)
 *   .before(async (ctx) => {
 *     console.log('Before:', ctx.data)
 *   })
 *   .after(async (ctx) => {
 *     console.log('After:', ctx.data)
 *   })
 *   .onError(async (error, ctx) => {
 *     console.error('Error:', error)
 *   })
 *   .build()
 * ```
 */
export class MiddlewareBuilder<T = ContextData> {
  private _name: string
  private _priority: number = 0
  private _beforeHooks: Array<(context: MiddlewareContext<T>) => void | Promise<void>> = []
  private _afterHooks: Array<(context: MiddlewareContext<T>) => void | Promise<void>> = []
  private _errorHandler?: (error: Error, context: MiddlewareContext<T>) => void | Promise<void>
  private _condition?: (context: MiddlewareContext<T>) => boolean | Promise<boolean>

  constructor(name: string) {
    this._name = name
  }

  /**
   * 设置优先级
   */
  priority(value: number): this {
    this._priority = value
    return this
  }

  /**
   * 添加前置钩子
   */
  before(hook: (context: MiddlewareContext<T>) => void | Promise<void>): this {
    this._beforeHooks.push(hook)
    return this
  }

  /**
   * 添加后置钩子
   */
  after(hook: (context: MiddlewareContext<T>) => void | Promise<void>): this {
    this._afterHooks.push(hook)
    return this
  }

  /**
   * 设置错误处理器
   */
  onError(handler: (error: Error, context: MiddlewareContext<T>) => void | Promise<void>): this {
    this._errorHandler = handler
    return this
  }

  /**
   * 设置执行条件
   */
  when(condition: (context: MiddlewareContext<T>) => boolean | Promise<boolean>): this {
    this._condition = condition
    return this
  }

  /**
   * 构建中间件
   */
  build(): Middleware {
    const beforeHooks = this._beforeHooks
    const afterHooks = this._afterHooks
    const condition = this._condition

    const middleware: Middleware = {
      name: this._name,
      priority: this._priority,
      onError: this._errorHandler as Middleware['onError'],
      async execute(context, next) {
        // 检查条件
        if (condition) {
          const shouldExecute = await condition(context as MiddlewareContext<T>)
          if (!shouldExecute) {
            await next()
            return
          }
        }

        // 执行前置钩子
        for (const hook of beforeHooks) {
          await hook(context as MiddlewareContext<T>)
          if (context.cancelled) return
        }

        // 调用下一个中间件
        await next()

        // 执行后置钩子（逆序）
        for (let i = afterHooks.length - 1; i >= 0; i--) {
          await afterHooks[i](context as MiddlewareContext<T>)
        }
      }
    }

    return middleware
  }
}

/**
 * 创建中间件构建器
 *
 * @param name - 中间件名称
 * @returns 中间件构建器实例
 */
export function createMiddlewareBuilder<T = ContextData>(name: string): MiddlewareBuilder<T> {
  return new MiddlewareBuilder<T>(name)
}

/**
 * 重试中间件包装器
 *
 * 将普通中间件包装为具有重试能力的中间件
 *
 * @param middleware - 原始中间件
 * @param maxRetries - 最大重试次数
 * @param delay - 重试延迟（毫秒）
 * @returns 带重试能力的中间件
 *
 * @example
 * ```typescript
 * const retryableMiddleware = withRetry(fetchMiddleware, 3, 1000)
 * ```
 */
export function withRetry(
  middleware: Middleware,
  maxRetries: number = 3,
  delay: number = 1000
): Middleware {
  return {
    name: `${middleware.name}:retry`,
    priority: middleware.priority,
    async execute(context, next) {
      let lastError: Error | undefined

      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          await middleware.execute(context, next)
          return // 成功，退出
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))

          if (attempt <= maxRetries) {
            console.warn(
              `Middleware "${middleware.name}" failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms...`
            )
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      // 所有重试失败
      if (middleware.onError) {
        await middleware.onError(lastError!, context)
      } else {
        throw lastError
      }
    },
    onError: middleware.onError
  }
}

/**
 * 超时中间件包装器
 *
 * 为中间件添加超时控制
 *
 * @param middleware - 原始中间件
 * @param timeout - 超时时间（毫秒）
 * @returns 带超时控制的中间件
 *
 * @example
 * ```typescript
 * const timedMiddleware = withTimeout(slowMiddleware, 5000)
 * ```
 */
export function withTimeout(
  middleware: Middleware,
  timeout: number
): Middleware {
  return {
    name: `${middleware.name}:timeout`,
    priority: middleware.priority,
    async execute(context, next) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Middleware "${middleware.name}" timed out after ${timeout}ms`))
        }, timeout)
      })

      await Promise.race([
        middleware.execute(context, next),
        timeoutPromise
      ])
    },
    onError: middleware.onError
  }
}

