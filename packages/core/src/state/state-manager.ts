/**
 * 状态管理器实现
 *
 * 提供高性能的状态管理功能,支持状态监听、批量更新和内存优化
 *
 * @module state-manager
 */

import type { StateManager, StateChangeListener, Unsubscribe } from '../types'

/**
 * 核心状态管理器
 *
 * 特性:
 * - 基于 Map 的高性能存储
 * - 支持状态变化监听
 * - 批量更新优化
 * - 自动内存清理
 * - 防止内存泄漏
 *
 * @example
 * ```typescript
 * const stateManager = createStateManager()
 *
 * // 设置状态
 * stateManager.set('user', { name: 'Alice', age: 25 })
 *
 * // 监听状态变化
 * const unwatch = stateManager.watch('user', (newValue, oldValue) => {
 *   console.log('User changed:', newValue)
 * })
 *
 * // 批量更新(性能优化)
 * stateManager.batch(() => {
 *   stateManager.set('count', 1)
 *   stateManager.set('total', 100)
 * })
 *
 * // 清理监听器
 * unwatch()
 * ```
 */
export class CoreStateManager implements StateManager {
  /** 状态存储 - 使用 Map 提供 O(1) 的读写性能 */
  private state = new Map<string, any>()

  /** 监听器存储 - 每个状态键对应一组监听器 */
  private watchers = new Map<string, Set<StateChangeListener>>()

  /** 批量更新标志 - 用于优化多次连续更新 */
  private batching = false

  /** 批量更新队列 - 存储待触发的监听器 */
  private batchQueue = new Map<string, { value: any; oldValue: any }>()

  /**
   * 设置状态值
   *
   * 性能优化:
   * - 仅在值实际改变时触发监听器
   * - 支持批量更新模式减少监听器调用
   *
   * @param key - 状态键
   * @param value - 状态值
   *
   * @example
   * ```typescript
   * stateManager.set('count', 0)
   * stateManager.set('user', { name: 'Bob' })
   * ```
   */
  set<T = any>(key: string, value: T): void {
    const oldValue = this.state.get(key)

    // 性能优化: 值未改变时跳过更新
    if (oldValue === value) {
      return
    }

    this.state.set(key, value)

    // 批量更新模式: 将更新加入队列
    if (this.batching) {
      this.batchQueue.set(key, { value, oldValue })
      return
    }

    // 立即触发监听器
    this.notifyWatchers(key, value, oldValue)
  }

  /**
   * 获取状态值
   *
   * @param key - 状态键
   * @returns 状态值,不存在时返回 undefined
   *
   * @example
   * ```typescript
   * const count = stateManager.get<number>('count')
   * const user = stateManager.get<User>('user')
   * ```
   */
  get<T = any>(key: string): T | undefined {
    return this.state.get(key)
  }

  /**
   * 检查状态是否存在
   *
   * @param key - 状态键
   * @returns 是否存在
   *
   * @example
   * ```typescript
   * if (stateManager.has('user')) {
   *   console.log('User exists')
   * }
   * ```
   */
  has(key: string): boolean {
    return this.state.has(key)
  }

  /**
   * 删除状态
   *
   * 内存优化: 同时清理相关的监听器,防止内存泄漏
   *
   * @param key - 状态键
   * @returns 是否删除成功
   *
   * @example
   * ```typescript
   * stateManager.delete('tempData')
   * ```
   */
  delete(key: string): boolean {
    const result = this.state.delete(key)

    // 内存优化: 清理监听器,防止内存泄漏
    const listeners = this.watchers.get(key)
    if (listeners) {
      listeners.clear()
      this.watchers.delete(key)
    }

    return result
  }

  /**
   * 清空所有状态
   *
   * 内存优化: 彻底清理所有状态和监听器
   *
   * @example
   * ```typescript
   * stateManager.clear()
   * ```
   */
  clear(): void {
    // 清理所有监听器集合
    this.watchers.forEach(listeners => listeners.clear())

    this.state.clear()
    this.watchers.clear()
    this.batchQueue.clear()
  }

  /**
   * 监听状态变化
   *
   * @param key - 状态键
   * @param listener - 监听器函数
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * const unwatch = stateManager.watch('count', (newValue, oldValue) => {
   *   console.log(`Count changed from ${oldValue} to ${newValue}`)
   * })
   *
   * // 取消监听
   * unwatch()
   * ```
   */
  watch<T = any>(key: string, listener: StateChangeListener<T>): Unsubscribe {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set())
    }

    const listeners = this.watchers.get(key)!
    listeners.add(listener)

    // 返回取消监听函数 - 防止内存泄漏
    return () => {
      listeners.delete(listener)

      // 内存优化: 如果没有监听器了,删除整个 Set
      if (listeners.size === 0) {
        this.watchers.delete(key)
      }
    }
  }

  /**
   * 批量更新状态
   *
   * 性能优化: 在批量更新期间,所有状态变化会被收集,
   * 在批量更新结束后统一触发监听器,避免重复调用
   *
   * @param fn - 批量更新函数
   *
   * @example
   * ```typescript
   * // 不使用批量更新: 触发 3 次监听器
   * stateManager.set('a', 1)
   * stateManager.set('b', 2)
   * stateManager.set('c', 3)
   *
   * // 使用批量更新: 只触发 1 次监听器
   * stateManager.batch(() => {
   *   stateManager.set('a', 1)
   *   stateManager.set('b', 2)
   *   stateManager.set('c', 3)
   * })
   * ```
   */
  batch(fn: () => void): void {
    // 防止嵌套批量更新
    if (this.batching) {
      fn()
      return
    }

    this.batching = true
    this.batchQueue.clear()

    try {
      fn()
    } finally {
      this.batching = false

      // 批量触发所有监听器
      this.batchQueue.forEach(({ value, oldValue }, key) => {
        this.notifyWatchers(key, value, oldValue)
      })

      this.batchQueue.clear()
    }
  }

  /**
   * 获取所有状态键
   *
   * @returns 状态键数组
   *
   * @example
   * ```typescript
   * const keys = stateManager.keys()
   * console.log('All state keys:', keys)
   * ```
   */
  keys(): string[] {
    return Array.from(this.state.keys())
  }

  /**
   * 获取所有状态
   *
   * 注意: 返回的是状态的浅拷贝,修改返回对象不会影响内部状态
   *
   * @returns 所有状态的键值对对象
   *
   * @example
   * ```typescript
   * const allState = stateManager.getAll()
   * console.log('Current state:', allState)
   * ```
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {}
    this.state.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  /**
   * 触发状态监听器 (内部方法)
   *
   * 错误处理: 单个监听器的错误不会影响其他监听器的执行
   *
   * @param key - 状态键
   * @param value - 新值
   * @param oldValue - 旧值
   * @private
   */
  private notifyWatchers(key: string, value: any, oldValue: any): void {
    const listeners = this.watchers.get(key)

    // 性能优化: 没有监听器时直接返回
    if (!listeners || listeners.size === 0) {
      return
    }

    // 遍历并调用所有监听器
    listeners.forEach(listener => {
      try {
        listener(value, oldValue)
      } catch (error) {
        // 错误隔离: 单个监听器错误不影响其他监听器
        console.error(`Error in state watcher for "${key}":`, error)
      }
    })
  }
}

/**
 * 创建状态管理器实例
 *
 * @returns 状态管理器实例
 *
 * @example
 * ```typescript
 * import { createStateManager } from '@ldesign/engine-core'
 *
 * const stateManager = createStateManager()
 * ```
 */
export function createStateManager(): StateManager {
  return new CoreStateManager()
}

