/**
 * 生命周期管理器实现
 *
 * 提供统一的生命周期钩子管理,支持异步处理和错误隔离
 *
 * @module lifecycle-manager
 */

import type {
  LifecycleHook,
  LifecycleHandler,
  LifecycleManager,
} from '../types'
import { EngineError, ErrorCode } from '../errors'

/**
 * 一次性钩子处理器包装器
 * @private
 */
interface OnceWrapper {
  /** 原始处理器 */
  original: LifecycleHandler
  /** 包装后的处理器 */
  wrapped: LifecycleHandler
}

/**
 * 核心生命周期管理器
 *
 * 特性:
 * - 支持异步钩子处理
 * - 错误隔离
 * - 一次性钩子
 * - 钩子优先级
 * - 防止内存泄漏
 *
 * 生命周期钩子:
 * - beforeInit: 初始化前
 * - init: 初始化
 * - afterInit: 初始化后
 * - beforeMount: 挂载前
 * - mounted: 已挂载
 * - beforeUpdate: 更新前
 * - updated: 已更新
 * - beforeUnmount: 卸载前
 * - unmounted: 已卸载
 *
 * @example
 * ```typescript
 * const lifecycleManager = createLifecycleManager()
 *
 * // 注册钩子
 * lifecycleManager.on('mounted', async () => {
 *   console.log('App mounted')
 *   await loadData()
 * })
 *
 * // 触发钩子
 * await lifecycleManager.trigger('mounted')
 *
 * // 一次性钩子
 * lifecycleManager.once('init', () => {
 *   console.log('This runs only once')
 * })
 * ```
 */
export class CoreLifecycleManager implements LifecycleManager {
  /** 钩子处理器存储 */
  private hooks = new Map<LifecycleHook, Set<LifecycleHandler>>()

  /** 一次性钩子包装器映射 - 用于正确清理 */
  private onceWrappers = new Map<LifecycleHook, Map<LifecycleHandler, OnceWrapper>>()

  /** 钩子触发历史 - 用于调试和性能分析 */
  private triggerHistory = new Map<LifecycleHook, number>()

  /**
   * 注册生命周期钩子
   *
   * @param hook - 钩子名称
   * @param handler - 处理函数
   *
   * @example
   * ```typescript
   * lifecycleManager.on('mounted', () => {
   *   console.log('Component mounted')
   * })
   *
   * // 异步处理器
   * lifecycleManager.on('beforeMount', async () => {
   *   await fetchData()
   * })
   * ```
   */
  on(hook: LifecycleHook, handler: LifecycleHandler): void {
    if (!this.hooks.has(hook)) {
      this.hooks.set(hook, new Set())
    }
    this.hooks.get(hook)!.add(handler)
  }

  /**
   * 移除生命周期钩子
   *
   * @param hook - 钩子名称
   * @param handler - 处理函数,不传则移除该钩子的所有处理器
   *
   * @example
   * ```typescript
   * // 移除特定处理器
   * lifecycleManager.off('mounted', handleMounted)
   *
   * // 移除所有处理器
   * lifecycleManager.off('mounted')
   * ```
   */
  off(hook: LifecycleHook, handler?: LifecycleHandler): void {
    if (!handler) {
      // 移除所有处理函数
      const handlers = this.hooks.get(hook)
      if (handlers) {
        handlers.clear()
        this.hooks.delete(hook)
      }

      // 清理 once 包装器
      this.onceWrappers.delete(hook)
      return
    }

    // 检查是否是 once 钩子
    const wrappers = this.onceWrappers.get(hook)
    if (wrappers?.has(handler)) {
      const wrapper = wrappers.get(handler)!
      this.hooks.get(hook)?.delete(wrapper.wrapped)
      wrappers.delete(handler)

      // 清理空的包装器映射
      if (wrappers.size === 0) {
        this.onceWrappers.delete(hook)
      }
    } else {
      // 移除普通处理函数
      this.hooks.get(hook)?.delete(handler)
    }

    // 内存优化: 清理空的钩子集合
    const handlers = this.hooks.get(hook)
    if (handlers && handlers.size === 0) {
      this.hooks.delete(hook)
    }
  }

  /**
   * 触发生命周期钩子
   *
   * 执行策略:
   * - 并行执行所有异步处理器
   * - 错误隔离,单个处理器错误不影响其他处理器
   * - 记录触发历史
   *
   * @param hook - 钩子名称
   * @param args - 传递给处理器的参数
   *
   * @example
   * ```typescript
   * // 触发钩子
   * await lifecycleManager.trigger('mounted')
   *
   * // 传递参数
   * await lifecycleManager.trigger('beforeUpdate', oldData, newData)
   * ```
   */
  async trigger(hook: LifecycleHook, ...args: unknown[]): Promise<void> {
    const handlers = this.hooks.get(hook)

    // 性能优化: 没有处理器时快速返回
    if (!handlers || handlers.size === 0) {
      return
    }

    // 记录触发次数
    const count = this.triggerHistory.get(hook) ?? 0
    this.triggerHistory.set(hook, count + 1)

    // 创建处理器数组副本,避免在执行过程中修改集合
    const handlersCopy = Array.from(handlers)

    // 并行执行所有处理器
    const results = await Promise.allSettled(
      handlersCopy.map(async handler => {
        try {
          await handler(...args)
        } catch (error) {
          // 错误隔离: 记录错误但不中断其他处理器
          console.error(`Error in lifecycle hook "${hook}":`, error)
          throw error
        }
      })
    )

    // 检查是否有错误
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason)

    // 修复：如果有错误，抛出 EngineError 以阻止后续流程
    if (errors.length > 0) {
      const errorMessages = errors.map(e =>
        e === null || e === undefined ? 'Unknown error' : (e instanceof Error ? e.message : String(e))
      ).join('; ')
      
      // 修复：正确的参数顺序 (message, code, options) 和属性名称
      const error = new EngineError(
        `${errors.length} error(s) occurred in lifecycle hook "${hook}": ${errorMessages}`,
        6000, // ErrorCode.LIFECYCLE_HOOK_ERROR
        {
          severity: 'high',
          recoverable: false,
          details: {
            hook,
            errorCount: errors.length,
            errors: errors.map(e => ({
              message: e === null || e === undefined ? 'Unknown error' : (e instanceof Error ? e.message : String(e)),
              stack: e instanceof Error ? e.stack : undefined
            }))
          },
          cause: errors[0] instanceof Error ? errors[0] : undefined
        }
      )
      
      // 添加上下文信息作为错误对象的属性
      ;(error as EngineError & { context?: Record<string, unknown> }).context = {
        operation: `lifecycle:${hook}`,
        data: {
          hook,
          errorCount: errors.length,
          errors: errors.map(e => ({
            message: e === null || e === undefined ? 'Unknown error' : (e instanceof Error ? e.message : String(e)),
            stack: e instanceof Error ? e.stack : undefined
          }))
        },
        module: 'engine',
        timestamp: Date.now()
      }
      
      throw error
    }
  }

  /**
   * 一次性钩子
   *
   * 钩子触发一次后自动移除
   *
   * @param hook - 钩子名称
   * @param handler - 处理函数
   *
   * @example
   * ```typescript
   * lifecycleManager.once('init', () => {
   *   console.log('Initialized - runs only once')
   * })
   * ```
   */
  once(hook: LifecycleHook, handler: LifecycleHandler): void {
    // 创建包装函数
    const wrappedHandler: LifecycleHandler = async (...args: unknown[]) => {
      // 先移除钩子
      this.off(hook, handler)

      // 再执行处理器
      await handler(...args)
    }

    // 保存包装器映射
    if (!this.onceWrappers.has(hook)) {
      this.onceWrappers.set(hook, new Map())
    }
    this.onceWrappers.get(hook)!.set(handler, {
      original: handler,
      wrapped: wrappedHandler,
    })

    // 注册包装后的处理器
    this.on(hook, wrappedHandler)
  }

  /**
   * 清空所有钩子
   *
   * 内存优化: 彻底清理所有处理器和包装器
   *
   * @example
   * ```typescript
   * lifecycleManager.clear()
   * ```
   */
  clear(): void {
    // 清理所有处理器集合
    this.hooks.forEach(handlers => handlers.clear())
    this.hooks.clear()

    // 清理所有 once 包装器
    this.onceWrappers.forEach(wrappers => wrappers.clear())
    this.onceWrappers.clear()

    // 清理触发历史
    this.triggerHistory.clear()
  }

  /**
   * 获取钩子处理函数列表
   *
   * @param hook - 钩子名称
   * @returns 处理函数数组
   *
   * @example
   * ```typescript
   * const handlers = lifecycleManager.getHandlers('mounted')
   * console.log(`${handlers.length} handlers for mounted hook`)
   * ```
   */
  getHandlers(hook: LifecycleHook): LifecycleHandler[] {
    const handlers = this.hooks.get(hook)
    return handlers ? Array.from(handlers) : []
  }

  /**
   * 获取钩子处理器数量
   *
   * @param hook - 钩子名称
   * @returns 处理器数量
   *
   * @example
   * ```typescript
   * const count = lifecycleManager.getHandlerCount('mounted')
   * ```
   */
  getHandlerCount(hook: LifecycleHook): number {
    return this.hooks.get(hook)?.size ?? 0
  }

  /**
   * 获取钩子触发次数
   *
   * @param hook - 钩子名称
   * @returns 触发次数
   *
   * @example
   * ```typescript
   * const count = lifecycleManager.getTriggerCount('mounted')
   * console.log(`Mounted hook triggered ${count} times`)
   * ```
   */
  getTriggerCount(hook: LifecycleHook): number {
    return this.triggerHistory.get(hook) ?? 0
  }

  /**
   * 获取所有钩子名称
   *
   * @returns 钩子名称数组
   *
   * @example
   * ```typescript
   * const hooks = lifecycleManager.getHookNames()
   * console.log('Registered hooks:', hooks)
   * ```
   */
  getHookNames(): LifecycleHook[] {
    return Array.from(this.hooks.keys())
  }
}

/**
 * 创建生命周期管理器实例
 *
 * @returns 生命周期管理器实例
 *
 * @example
 * ```typescript
 * import { createLifecycleManager } from '@ldesign/engine-core'
 *
 * const lifecycleManager = createLifecycleManager()
 * ```
 */
export function createLifecycleManager(): LifecycleManager {
  return new CoreLifecycleManager()
}

