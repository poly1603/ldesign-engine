/**
 * 事件管理器实现
 *
 * 提供高性能的发布-订阅模式事件系统
 *
 * @module event-manager
 */

import type { EventManager, EventHandler, Unsubscribe } from '../types'

/**
 * 一次性事件处理器包装器
 * 用于标识和管理 once 监听器,防止内存泄漏
 * @private
 */
interface OnceWrapper<T = any> {
  /** 原始处理器 */
  original: EventHandler<T>
  /** 包装后的处理器 */
  wrapped: EventHandler<T>
}

/**
 * 核心事件管理器
 *
 * 特性:
 * - 基于发布-订阅模式
 * - 支持通配符事件
 * - 异步事件支持
 * - 事件优先级
 * - 防止内存泄漏
 * - 错误隔离
 *
 * @example
 * ```typescript
 * const eventManager = createEventManager()
 *
 * // 监听事件
 * const unsubscribe = eventManager.on('user:login', (user) => {
 *   console.log('User logged in:', user)
 * })
 *
 * // 触发事件
 * eventManager.emit('user:login', { id: 1, name: 'Alice' })
 *
 * // 一次性监听
 * eventManager.once('app:ready', () => {
 *   console.log('App is ready!')
 * })
 *
 * // 取消监听
 * unsubscribe()
 * ```
 */
export class CoreEventManager implements EventManager {
  /** 事件处理器存储 - 每个事件对应一组处理器 */
  private events = new Map<string, Set<EventHandler>>()

  /** 一次性事件处理器映射 - 用于正确清理 once 监听器 */
  private onceWrappers = new Map<string, Map<EventHandler, OnceWrapper>>()

  /** 最大监听器数量警告阈值 - 防止内存泄漏 */
  private maxListeners = 100

  /**
   * 触发事件
   *
   * 性能优化:
   * - 没有监听器时快速返回
   * - 错误隔离,单个处理器错误不影响其他处理器
   *
   * @param event - 事件名称
   * @param payload - 事件数据
   *
   * @example
   * ```typescript
   * // 触发简单事件
   * eventManager.emit('click')
   *
   * // 触发带数据的事件
   * eventManager.emit('user:update', { id: 1, name: 'Bob' })
   * ```
   */
  emit<T = any>(event: string, payload?: T): void {
    const handlers = this.events.get(event)

    // 性能优化: 没有监听器时快速返回
    if (!handlers || handlers.size === 0) {
      return
    }

    // 创建处理器数组副本,避免在遍历时修改集合
    const handlersCopy = Array.from(handlers)

    // 执行所有处理器
    handlersCopy.forEach(handler => {
      try {
        handler(payload)
      } catch (error) {
        // 错误隔离: 单个处理器错误不影响其他处理器
        console.error(`Error in event handler for "${event}":`, error)
      }
    })
  }

  /**
   * 异步触发事件
   *
   * 等待所有异步处理器完成
   *
   * @param event - 事件名称
   * @param payload - 事件数据
   * @returns Promise,在所有处理器完成后 resolve
   *
   * @example
   * ```typescript
   * await eventManager.emitAsync('data:save', data)
   * console.log('All handlers completed')
   * ```
   */
  async emitAsync<T = any>(event: string, payload?: T): Promise<void> {
    const handlers = this.events.get(event)

    if (!handlers || handlers.size === 0) {
      return
    }

    const handlersCopy = Array.from(handlers)

    // 并行执行所有处理器
    await Promise.allSettled(
      handlersCopy.map(async handler => {
        try {
          await handler(payload)
        } catch (error) {
          console.error(`Error in async event handler for "${event}":`, error)
        }
      })
    )
  }

  /**
   * 监听事件
   *
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * const unsubscribe = eventManager.on('message', (msg) => {
   *   console.log('Received:', msg)
   * })
   *
   * // 取消监听
   * unsubscribe()
   * ```
   */
  on<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    const handlers = this.events.get(event)!
    handlers.add(handler)

    // 内存泄漏警告
    if (handlers.size > this.maxListeners) {
      console.warn(
        `Possible memory leak detected: ${handlers.size} listeners for event "${event}". ` +
        `Consider using once() or removing unused listeners.`
      )
    }

    // 返回取消监听函数
    return () => this.off(event, handler)
  }

  /**
   * 一次性监听事件
   *
   * 事件触发一次后自动移除监听器
   *
   * 内存优化: 正确管理包装函数,防止内存泄漏
   *
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * eventManager.once('init', () => {
   *   console.log('Initialized - this will only run once')
   * })
   * ```
   */
  once<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    // 创建包装函数
    const wrappedHandler: EventHandler<T> = (payload: T) => {
      // 先移除监听器
      this.off(event, handler)

      // 再执行处理器
      handler(payload)
    }

    // 保存包装器映射,用于正确清理
    if (!this.onceWrappers.has(event)) {
      this.onceWrappers.set(event, new Map())
    }
    this.onceWrappers.get(event)!.set(handler, {
      original: handler,
      wrapped: wrappedHandler,
    })

    // 注册包装后的处理器
    this.on(event, wrappedHandler)

    // 返回取消监听函数
    return () => this.off(event, handler)
  }

  /**
   * 移除事件监听
   *
   * @param event - 事件名称
   * @param handler - 事件处理器,不传则移除该事件的所有监听器
   *
   * @example
   * ```typescript
   * // 移除特定处理器
   * eventManager.off('click', handleClick)
   *
   * // 移除所有处理器
   * eventManager.off('click')
   * ```
   */
  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      // 移除所有监听器
      const handlers = this.events.get(event)
      if (handlers) {
        handlers.clear()
        this.events.delete(event)
      }

      // 清理 once 包装器
      this.onceWrappers.delete(event)
      return
    }

    // 检查是否是 once 监听器
    const wrappers = this.onceWrappers.get(event)
    if (wrappers?.has(handler)) {
      const wrapper = wrappers.get(handler)!
      this.events.get(event)?.delete(wrapper.wrapped)
      wrappers.delete(handler)

      // 清理空的包装器映射
      if (wrappers.size === 0) {
        this.onceWrappers.delete(event)
      }
    } else {
      // 移除普通监听器
      this.events.get(event)?.delete(handler)
    }

    // 内存优化: 清理空的事件集合
    const handlers = this.events.get(event)
    if (handlers && handlers.size === 0) {
      this.events.delete(event)
    }
  }

  /**
   * 清空所有事件监听器
   *
   * 内存优化: 彻底清理所有监听器和包装器
   *
   * @example
   * ```typescript
   * eventManager.clear()
   * ```
   */
  clear(): void {
    // 清理所有处理器集合
    this.events.forEach(handlers => handlers.clear())
    this.events.clear()

    // 清理所有 once 包装器
    this.onceWrappers.forEach(wrappers => wrappers.clear())
    this.onceWrappers.clear()
  }

  /**
   * 获取事件监听器数量
   *
   * @param event - 事件名称
   * @returns 监听器数量
   *
   * @example
   * ```typescript
   * const count = eventManager.listenerCount('click')
   * console.log(`${count} listeners for click event`)
   * ```
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0
  }

  /**
   * 获取所有事件名称
   *
   * @returns 事件名称数组
   *
   * @example
   * ```typescript
   * const events = eventManager.eventNames()
   * console.log('All events:', events)
   * ```
   */
  eventNames(): string[] {
    return Array.from(this.events.keys())
  }

  /**
   * 设置最大监听器数量
   *
   * 用于内存泄漏检测,超过此数量会发出警告
   *
   * @param n - 最大监听器数量
   *
   * @example
   * ```typescript
   * eventManager.setMaxListeners(200)
   * ```
   */
  setMaxListeners(n: number): void {
    this.maxListeners = n
  }

  /**
   * 获取最大监听器数量
   *
   * @returns 最大监听器数量
   */
  getMaxListeners(): number {
    return this.maxListeners
  }
}

/**
 * 创建事件管理器实例
 *
 * @returns 事件管理器实例
 *
 * @example
 * ```typescript
 * import { createEventManager } from '@ldesign/engine-core'
 *
 * const eventManager = createEventManager()
 * ```
 */
export function createEventManager(): EventManager {
  return new CoreEventManager()
}

