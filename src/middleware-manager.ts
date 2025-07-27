import type {
  LifecycleHook,
  MiddlewareContext,
  MiddlewareFunction,
  MiddlewareManager,
} from './types'
import { MiddlewareError } from './types'

/**
 * 中间件信息接口
 */
interface MiddlewareInfo {
  middleware: MiddlewareFunction
  priority: number
  name?: string
  once?: boolean
}

/**
 * 中间件管理器实现
 * 提供生命周期钩子中间件的注册、执行和管理功能
 */
export class MiddlewareManagerImpl implements MiddlewareManager {
  private middlewares = new Map<LifecycleHook, MiddlewareInfo[]>()
  private executing = new Set<LifecycleHook>()
  private executionCount = new Map<string, number>()

  /**
   * 添加中间件
   */
  add(
    hook: LifecycleHook,
    middleware: MiddlewareFunction,
    options: {
      priority?: number
      name?: string
      once?: boolean
    } = {},
  ): void {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function')
    }

    if (!this.isValidHook(hook)) {
      throw new MiddlewareError(`Invalid lifecycle hook: ${hook}`, hook)
    }

    let middlewareList = this.middlewares.get(hook)
    if (!middlewareList) {
      middlewareList = []
      this.middlewares.set(hook, middlewareList)
    }

    const middlewareInfo: MiddlewareInfo = {
      middleware,
      priority: options.priority || 0,
      name: options.name,
      once: options.once || false,
    }

    // 按优先级插入
    const insertIndex = middlewareList.findIndex(
      item => item.priority < middlewareInfo.priority,
    )

    if (insertIndex === -1) {
      middlewareList.push(middlewareInfo)
    }
 else {
      middlewareList.splice(insertIndex, 0, middlewareInfo)
    }
  }

  /**
   * 移除中间件
   */
  remove(hook: LifecycleHook, middleware: MiddlewareFunction): void {
    const middlewareList = this.middlewares.get(hook)
    if (!middlewareList) {
      return
    }

    const index = middlewareList.findIndex(item => item.middleware === middleware)
    if (index !== -1) {
      middlewareList.splice(index, 1)

      // 如果列表为空，删除整个钩子
      if (middlewareList.length === 0) {
        this.middlewares.delete(hook)
      }
    }
  }

  /**
   * 执行中间件链
   */
  async execute(hook: LifecycleHook, context: MiddlewareContext): Promise<void> {
    if (this.executing.has(hook)) {
      throw new MiddlewareError(
        `Middleware for hook '${hook}' is already executing`,
        hook,
      )
    }

    const middlewareList = this.middlewares.get(hook)
    if (!middlewareList || middlewareList.length === 0) {
      return
    }

    this.executing.add(hook)

    try {
      await this.executeMiddlewareChain(middlewareList, context, hook)
    }
 finally {
      this.executing.delete(hook)
    }
  }

  /**
   * 执行中间件链
   */
  private async executeMiddlewareChain(
    middlewareList: MiddlewareInfo[],
    context: MiddlewareContext,
    hook: LifecycleHook,
  ): Promise<void> {
    let index = 0
    const toRemove: MiddlewareInfo[] = []

    const next = async (): Promise<void> => {
      if (index >= middlewareList.length) {
        return
      }

      const middlewareInfo = middlewareList[index++]
      const { middleware, name, once } = middlewareInfo

      try {
        // 记录执行次数
        const key = `${hook}:${name || 'anonymous'}`
        const count = this.executionCount.get(key) || 0
        this.executionCount.set(key, count + 1)

        // 执行中间件
        await middleware(context, next)

        // 如果是一次性中间件，标记为待移除
        if (once) {
          toRemove.push(middlewareInfo)
        }
      }
 catch (error) {
        const middlewareError = new MiddlewareError(
          `Error in middleware '${name || 'anonymous'}' for hook '${hook}': ${error instanceof Error ? error.message : String(error)}`,
          hook,
          { middleware, error, context },
        )

        // 发射错误事件
        if (context.engine && typeof context.engine.emit === 'function') {
          context.engine.emit('middleware:error', middlewareError)
        }

        throw middlewareError
      }
    }

    await next()

    // 移除一次性中间件
    toRemove.forEach((middlewareInfo) => {
      const list = this.middlewares.get(hook)
      if (list) {
        const index = list.indexOf(middlewareInfo)
        if (index !== -1) {
          list.splice(index, 1)
        }
      }
    })
  }

  /**
   * 清除中间件
   */
  clear(hook?: LifecycleHook): void {
    if (hook) {
      this.middlewares.delete(hook)
    }
 else {
      this.middlewares.clear()
    }
  }

  /**
   * 获取中间件数量
   */
  count(hook?: LifecycleHook): number {
    if (hook) {
      const middlewareList = this.middlewares.get(hook)
      return middlewareList ? middlewareList.length : 0
    }

    let total = 0
    for (const list of this.middlewares.values()) {
      total += list.length
    }
    return total
  }

  /**
   * 获取所有钩子
   */
  getHooks(): LifecycleHook[] {
    return Array.from(this.middlewares.keys())
  }

  /**
   * 获取钩子的中间件列表
   */
  getMiddlewares(hook: LifecycleHook): MiddlewareFunction[] {
    const middlewareList = this.middlewares.get(hook)
    return middlewareList ? middlewareList.map(item => item.middleware) : []
  }

  /**
   * 检查是否有中间件
   */
  has(hook: LifecycleHook, middleware?: MiddlewareFunction): boolean {
    const middlewareList = this.middlewares.get(hook)
    if (!middlewareList) {
      return false
    }

    if (!middleware) {
      return middlewareList.length > 0
    }

    return middlewareList.some(item => item.middleware === middleware)
  }

  /**
   * 检查钩子是否正在执行
   */
  isExecuting(hook: LifecycleHook): boolean {
    return this.executing.has(hook)
  }

  /**
   * 获取执行统计
   */
  getExecutionStats(): Record<string, number> {
    return Object.fromEntries(this.executionCount)
  }

  /**
   * 重置执行统计
   */
  resetExecutionStats(): void {
    this.executionCount.clear()
  }

  /**
   * 获取中间件信息
   */
  getMiddlewareInfo(hook: LifecycleHook): Array<{
    name?: string
    priority: number
    once?: boolean
  }> {
    const middlewareList = this.middlewares.get(hook)
    if (!middlewareList) {
      return []
    }

    return middlewareList.map(({ name, priority, once }) => ({
      name,
      priority,
      once,
    }))
  }

  /**
   * 验证生命周期钩子
   */
  private isValidHook(hook: string): hook is LifecycleHook {
    const validHooks: LifecycleHook[] = [
      'beforeCreate',
      'created',
      'beforeMount',
      'mounted',
      'beforeUpdate',
      'updated',
      'beforeUnmount',
      'unmounted',
    ]

    return validHooks.includes(hook as LifecycleHook)
  }

  /**
   * 克隆中间件管理器
   */
  clone(): MiddlewareManagerImpl {
    const cloned = new MiddlewareManagerImpl()

    for (const [hook, middlewareList] of this.middlewares) {
      cloned.middlewares.set(hook, [...middlewareList])
    }

    return cloned
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    hooks: number
    middlewares: number
    executing: number
    executionCount: Record<string, number>
  } {
    return {
      hooks: this.middlewares.size,
      middlewares: this.count(),
      executing: this.executing.size,
      executionCount: this.getExecutionStats(),
    }
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): {
    hooks: number
    middlewares: number
    executing: number
  } {
    return {
      hooks: this.middlewares.size,
      middlewares: this.count(),
      executing: this.executing.size,
    }
  }

  /**
   * 销毁中间件管理器
   */
  destroy(): void {
    this.clear()
    this.executing.clear()
    this.executionCount.clear()
  }
}
