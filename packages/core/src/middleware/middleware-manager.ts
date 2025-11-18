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
  async execute<T = any>(context: MiddlewareContext<T>): Promise<void> {
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
        // 错误处理: 优先使用中间件自己的错误处理器
        if (middleware.onError) {
          try {
            await middleware.onError(error as Error, context)
          } catch (handlerError) {
            // 错误处理器本身出错,向上抛出
            console.error(
              `Error in middleware "${middleware.name}" error handler:`,
              handlerError
            )
            throw handlerError
          }
        } else {
          // 没有错误处理器,向上抛出
          throw error
        }
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

