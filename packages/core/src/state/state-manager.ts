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
  private state = new Map<string, unknown>()

  /** 监听器存储 - 每个状态键对应一组监听器 */
  private watchers = new Map<string, Set<StateChangeListener>>()

  /** 批量更新标志 - 用于优化多次连续更新 */
  private batching = false

  /** 批量更新队列 - 存储待触发的监听器 */
  private batchQueue = new Map<string, { value: unknown; oldValue: unknown }>()

  /** 浅比较模式标记 - 标记哪些键使用浅比较 */
  private shallowKeys = new Set<string>()

  /** 深度比较最大深度 - 防止栈溢出 */
  private maxDepth = 10

  /** 性能优化:状态更新计数器,用于性能监控 */
  private updateCount = new Map<string, number>()

  /** 性能优化:批量更新性能统计 */
  private batchUpdateStats = {
    totalBatches: 0,
    totalUpdates: 0,
    savedNotifications: 0,
  }

  /**
   * 设置状态值
   *
   * 性能优化:
   * - 使用深度比较，仅在值实际改变时触发监听器
   * - 支持批量更新模式减少监听器调用
   * - 支持浅比较模式提升性能
   *
   * @param key - 状态键
   * @param value - 状态值
   *
   * @example
   * ```typescript
   * stateManager.set('count', 0)
   * stateManager.set('user', { name: 'Bob' })
   *
   * // 使用浅比较模式
   * stateManager.setShallow('bigObject', largeData)
   * ```
   */
  set<T = unknown>(key: string, value: T): void {
    const oldValue = this.state.get(key)

    // 性能优化: 根据键的比较模式选择比较方式
    const isEqual = this.shallowKeys.has(key)
      ? oldValue === value
      : this.deepEqual(oldValue, value)

    if (isEqual) {
      return
    }

    // 统计更新次数
    const count = this.updateCount.get(key) || 0
    this.updateCount.set(key, count + 1)

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
   * 设置状态值（浅比较模式）
   *
   * 性能优化: 使用浅比较（===），适用于大对象或频繁更新的场景
   *
   * @param key - 状态键
   * @param value - 状态值
   *
   * @example
   * ```typescript
   * // 对于大对象，使用浅比较可以显著提升性能
   * stateManager.setShallow('largeData', bigObject)
   * ```
   */
  setShallow<T = unknown>(key: string, value: T): void {
    this.shallowKeys.add(key)
    this.set(key, value)
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
  get<T = unknown>(key: string): T | undefined {
    return this.state.get(key) as T | undefined
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
  watch<T = unknown>(key: string, listener: StateChangeListener<T>): Unsubscribe {
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

    const startSize = this.batchQueue.size

    try {
      fn()
    } finally {
      this.batching = false

      // 统计批量更新性能
      const updateCount = this.batchQueue.size
      this.batchUpdateStats.totalBatches++
      this.batchUpdateStats.totalUpdates += updateCount
      this.batchUpdateStats.savedNotifications += Math.max(0, updateCount - startSize)

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
   * 批量设置状态
   *
   * 性能优化: 使用批量更新模式,减少监听器调用次数
   *
   * @param states - 状态键值对对象
   *
   * @example
   * ```typescript
   * stateManager.setAll({
   *   user: { name: 'Alice' },
   *   count: 0,
   *   theme: 'dark'
   * })
   * ```
   */
  setAll(states: Record<string, unknown>): void {
    this.batch(() => {
      Object.entries(states).forEach(([key, value]) => {
        this.set(key, value)
      })
    })
  }

  /**
   * 获取状态数量
   *
   * @returns 状态键的数量
   *
   * @example
   * ```typescript
   * const count = stateManager.size()
   * console.log('状态数量:', count)
   * ```
   */
  size(): number {
    return this.state.size
  }

  /**
   * 导出状态为 JSON 字符串
   *
   * 用于持久化或调试
   *
   * @param pretty - 是否格式化输出
   * @returns JSON 字符串
   *
   * @example
   * ```typescript
   * const json = stateManager.toJSON(true)
   * localStorage.setItem('app-state', json)
   * ```
   */
  toJSON(pretty = false): string {
    const state = this.getAll()
    return pretty ? JSON.stringify(state, null, 2) : JSON.stringify(state)
  }

  /**
   * 从 JSON 字符串导入状态
   *
   * 用于从持久化存储恢复状态
   *
   * @param json - JSON 字符串
   * @param merge - 是否合并到现有状态(默认为 false,会清空现有状态)
   *
   * @example
   * ```typescript
   * const json = localStorage.getItem('app-state')
   * if (json) {
   *   stateManager.fromJSON(json)
   * }
   * ```
   */
  fromJSON(json: string, merge = false): void {
    try {
      const states = JSON.parse(json)

      if (typeof states !== 'object' || states === null) {
        throw new Error('Invalid JSON: must be an object')
      }

      if (!merge) {
        this.clear()
      }

      this.setAll(states)
    }
    catch (error) {
      console.error('Failed to import state from JSON:', error)
      throw error
    }
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
  private notifyWatchers(key: string, value: unknown, oldValue: unknown): void {
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

  /**
   * 深度比较两个值是否相等
   *
   * 性能优化:
   * - 基本类型使用 === 快速比较
   * - 对象类型递归比较所有属性
   * - 支持 Date、RegExp、Array 等特殊类型
   * - 限制递归深度防止栈溢出
   * - JSON 序列化快速路径
   *
   * @param a - 值 A
   * @param b - 值 B
   * @param depth - 当前递归深度
   * @returns 是否相等
   * @private
   */
  private deepEqual(a: unknown, b: unknown, depth = 0): boolean {
    // 修复：防止无限递归和栈溢出 - 使用 JSON.stringify 作为降级策略
    if (depth > this.maxDepth) {
      console.warn('[StateManager] Deep equal reached max depth, using JSON comparison as fallback')
      try {
        // 尝试使用 JSON 序列化比较
        return JSON.stringify(a) === JSON.stringify(b)
      } catch {
        // JSON 序列化失败，降级为浅比较
        return a === b
      }
    }
    // 快速路径: 引用相等或基本类型相等
    if (a === b) {
      return true
    }

    // null 或 undefined 处理
    if (a == null || b == null) {
      return a === b
    }

    // 类型不同
    if (typeof a !== typeof b) {
      return false
    }

    // 基本类型（已经通过 === 检查，这里不相等）
    if (typeof a !== 'object') {
      return false
    }

    // 性能优化: 对于简单对象，尝试 JSON 序列化快速比较
    if (depth === 0 && this.isSimpleObject(a) && this.isSimpleObject(b)) {
      try {
        return JSON.stringify(a) === JSON.stringify(b)
      } catch {
        // JSON 序列化失败，继续使用深度比较
      }
    }

    // Date 类型
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }

    // RegExp 类型
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString()
    }

    // 数组类型
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false
      }
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i], depth + 1)) {
          return false
        }
      }
      return true
    }

    // 数组和非数组不相等
    if (Array.isArray(a) !== Array.isArray(b)) {
      return false
    }

    // 对象类型
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    // 键数量不同
    if (keysA.length !== keysB.length) {
      return false
    }

    // 递归比较所有属性
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false
      }
      if (!this.deepEqual(a[key], b[key], depth + 1)) {
        return false
      }
    }

    return true
  }

  /**
   * 检查是否为简单对象（可 JSON 序列化）
   *
   * @param obj - 对象
   * @returns 是否为简单对象
   * @private
   */
  private isSimpleObject(obj: unknown): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false
    }

    // 排除特殊对象
    if (obj instanceof Date || obj instanceof RegExp || obj instanceof Error) {
      return false
    }

    // 排除包含函数的对象
    const proto = Object.getPrototypeOf(obj)
    if (proto !== Object.prototype && proto !== Array.prototype && proto !== null) {
      return false
    }

    return true
  }

  /**
   * 获取状态更新统计信息
   *
   * @returns 统计信息对象
   *
   * @example
   * ```typescript
   * const stats = stateManager.getUpdateStats()
   * console.log('总更新次数:', stats.totalUpdates)
   * console.log('批量更新效率:', stats.batchEfficiency)
   * ```
   */
  getUpdateStats(): {
    totalUpdates: number
    hotKeys: Array<{ key: string; count: number }>
    batchStats: {
      totalBatches: number
      totalUpdates: number
      savedNotifications: number
      avgUpdatesPerBatch: number
    }
  } {
    const totalUpdates = Array.from(this.updateCount.values()).reduce(
      (sum, count) => sum + count,
      0
    )

    const hotKeys = Array.from(this.updateCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))

    return {
      totalUpdates,
      hotKeys,
      batchStats: {
        ...this.batchUpdateStats,
        avgUpdatesPerBatch:
          this.batchUpdateStats.totalBatches > 0
            ? this.batchUpdateStats.totalUpdates /
            this.batchUpdateStats.totalBatches
            : 0,
      },
    }
  }

  /**
   * 设置深度比较的最大深度
   *
   * @param depth - 最大深度
   *
   * @example
   * ```typescript
   * stateManager.setMaxDepth(20) // 允许更深的对象嵌套
   * ```
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = Math.max(1, Math.min(depth, 50)) // 限制在 1-50 之间
  }

  /**
   * 重置统计信息
   *
   * @example
   * ```typescript
   * stateManager.resetStats()
   * ```
   */
  resetStats(): void {
    this.updateCount.clear()
    this.batchUpdateStats = {
      totalBatches: 0,
      totalUpdates: 0,
      savedNotifications: 0,
    }
  }
}

/**
 * 选择器缓存配置
 */
export interface SelectorCacheConfig {
  /** 最大缓存大小 */
  maxSize?: number
  /** 缓存过期时间（毫秒，0 表示不过期） */
  ttl?: number
}

/**
 * 选择器函数类型
 */
export type Selector<T, R> = (state: T) => R

/**
 * 带缓存的状态选择器
 *
 * 性能优化：缓存选择器结果，避免重复计算
 *
 * @example
 * ```typescript
 * const selector = createCachedSelector(
 *   stateManager,
 *   (state) => state.users?.filter(u => u.active)
 * )
 *
 * // 第一次调用会计算
 * const activeUsers = selector.select('users')
 *
 * // 如果 users 未变化，直接返回缓存结果
 * const activeUsers2 = selector.select('users')
 * ```
 */
export class CachedSelector<T = unknown, R = unknown> {
  private cache = new Map<string, { value: R; deps: unknown[]; timestamp: number }>()
  private config: Required<SelectorCacheConfig>

  constructor(
    private stateManager: StateManager,
    private selector: Selector<T, R>,
    config: SelectorCacheConfig = {}
  ) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      ttl: config.ttl ?? 0
    }
  }

  /**
   * 执行选择器
   *
   * @param keys - 依赖的状态键
   * @returns 选择器结果
   */
  select(...keys: string[]): R {
    const cacheKey = keys.join(':')
    const deps = keys.map(k => this.stateManager.get(k))
    const cached = this.cache.get(cacheKey)

    // 检查缓存是否有效
    if (cached) {
      const isValid = this.isCacheValid(cached, deps)
      if (isValid) {
        return cached.value
      }
    }

    // 计算新值
    const state = this.buildState(keys) as T
    const value = this.selector(state)

    // 更新缓存
    this.updateCache(cacheKey, value, deps)

    return value
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(
    cached: { value: R; deps: unknown[]; timestamp: number },
    currentDeps: unknown[]
  ): boolean {
    // 检查 TTL
    if (this.config.ttl > 0) {
      if (Date.now() - cached.timestamp > this.config.ttl) {
        return false
      }
    }

    // 检查依赖是否变化
    if (cached.deps.length !== currentDeps.length) {
      return false
    }

    for (let i = 0; i < cached.deps.length; i++) {
      if (cached.deps[i] !== currentDeps[i]) {
        return false
      }
    }

    return true
  }

  /**
   * 更新缓存
   */
  private updateCache(key: string, value: R, deps: unknown[]): void {
    // 检查缓存大小
    if (this.cache.size >= this.config.maxSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      deps,
      timestamp: Date.now()
    })
  }

  /**
   * 构建状态对象
   */
  private buildState(keys: string[]): Record<string, unknown> {
    const state: Record<string, unknown> = {}
    for (const key of keys) {
      state[key] = this.stateManager.get(key)
    }
    return state
  }
}

/**
 * 创建带缓存的选择器
 *
 * @param stateManager - 状态管理器
 * @param selector - 选择器函数
 * @param config - 缓存配置
 * @returns 缓存选择器实例
 */
export function createCachedSelector<T = unknown, R = unknown>(
  stateManager: StateManager,
  selector: Selector<T, R>,
  config?: SelectorCacheConfig
): CachedSelector<T, R> {
  return new CachedSelector(stateManager, selector, config)
}

/**
 * 防抖批量更新管理器
 *
 * 将短时间内的多次更新合并为一次
 *
 * @example
 * ```typescript
 * const debounced = new DebouncedBatchUpdater(stateManager, 16) // 16ms
 *
 * // 这些更新会被合并
 * debounced.set('a', 1)
 * debounced.set('b', 2)
 * debounced.set('a', 3) // 覆盖之前的值
 *
 * // 16ms 后统一应用
 * ```
 */
export class DebouncedBatchUpdater {
  private pendingUpdates = new Map<string, unknown>()
  private timer?: ReturnType<typeof setTimeout>
  private flushCallbacks: Array<() => void> = []

  constructor(
    private stateManager: StateManager,
    private delay: number = 16
  ) {}

  /**
   * 设置状态（延迟应用）
   *
   * @param key - 状态键
   * @param value - 状态值
   */
  set<T = unknown>(key: string, value: T): void {
    this.pendingUpdates.set(key, value)
    this.scheduleFlush()
  }

  /**
   * 立即应用所有待处理的更新
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }

    if (this.pendingUpdates.size === 0) {
      return
    }

    // 复制待处理更新
    const updates = new Map(this.pendingUpdates)
    this.pendingUpdates.clear()

    // 批量应用更新
    if ('batch' in this.stateManager && typeof (this.stateManager as any).batch === 'function') {
      (this.stateManager as any).batch(() => {
        updates.forEach((value, key) => {
          this.stateManager.set(key, value)
        })
      })
    } else {
      updates.forEach((value, key) => {
        this.stateManager.set(key, value)
      })
    }

    // 触发回调
    const callbacks = this.flushCallbacks.slice()
    this.flushCallbacks.length = 0
    callbacks.forEach(cb => cb())
  }

  /**
   * 等待下一次刷新
   */
  onFlush(callback: () => void): void {
    this.flushCallbacks.push(callback)
  }

  /**
   * 获取待处理更新数量
   */
  get pendingCount(): number {
    return this.pendingUpdates.size
  }

  /**
   * 取消所有待处理的更新
   */
  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.pendingUpdates.clear()
    this.flushCallbacks.length = 0
  }

  /**
   * 调度刷新
   */
  private scheduleFlush(): void {
    if (this.timer) {
      return
    }

    this.timer = setTimeout(() => {
      this.timer = undefined
      this.flush()
    }, this.delay)
  }
}

/**
 * 创建防抖批量更新器
 *
 * @param stateManager - 状态管理器
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖批量更新器实例
 */
export function createDebouncedUpdater(
  stateManager: StateManager,
  delay?: number
): DebouncedBatchUpdater {
  return new DebouncedBatchUpdater(stateManager, delay)
}

/**
 * 计算状态类
 *
 * 基于其他状态自动计算派生值
 *
 * @example
 * ```typescript
 * const computed = new ComputedState(
 *   stateManager,
 *   ['users', 'filter'],
 *   ({ users, filter }) => users?.filter(u => u.name.includes(filter))
 * )
 *
 * // 当 users 或 filter 变化时自动重新计算
 * const value = computed.get()
 * ```
 */
export class ComputedState<T = unknown> {
  private cachedValue: T | undefined
  private cachedDeps: unknown[] = []
  private subscriptions: Array<() => void> = []
  private dirty = true

  constructor(
    private stateManager: StateManager,
    private dependencies: string[],
    private compute: (deps: Record<string, unknown>) => T
  ) {
    // 监听依赖变化
    for (const key of dependencies) {
      const unsubscribe = stateManager.watch(key, () => {
        this.dirty = true
      })
      this.subscriptions.push(unsubscribe)
    }
  }

  /**
   * 获取计算值
   */
  get(): T {
    if (this.dirty) {
      this.recalculate()
    }
    return this.cachedValue as T
  }

  /**
   * 强制重新计算
   */
  invalidate(): void {
    this.dirty = true
  }

  /**
   * 销毁计算状态，释放订阅
   */
  dispose(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe()
    }
    this.subscriptions.length = 0
    this.cachedValue = undefined
    this.cachedDeps.length = 0
  }

  /**
   * 重新计算值
   */
  private recalculate(): void {
    const deps: Record<string, unknown> = {}
    for (const key of this.dependencies) {
      deps[key] = this.stateManager.get(key)
    }

    this.cachedValue = this.compute(deps)
    this.cachedDeps = Object.values(deps)
    this.dirty = false
  }
}

/**
 * 创建计算状态
 *
 * @param stateManager - 状态管理器
 * @param dependencies - 依赖的状态键
 * @param compute - 计算函数
 * @returns 计算状态实例
 */
export function createComputedState<T = unknown>(
  stateManager: StateManager,
  dependencies: string[],
  compute: (deps: Record<string, unknown>) => T
): ComputedState<T> {
  return new ComputedState(stateManager, dependencies, compute)
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

