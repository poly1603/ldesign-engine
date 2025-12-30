/**
 * 事件管理器实现
 *
 * 提供高性能的发布-订阅模式事件系统
 *
 * @module event-manager
 */

import type { EventManager, EventHandler, Unsubscribe, EventPayload } from '../types'

/**
 * 节流/防抖处理器选项
 */
export interface ThrottleOptions {
  /** 延迟时间（毫秒） */
  delay: number
  /** 是否在前沿触发（throttle 模式） */
  leading?: boolean
  /** 是否在后沿触发（throttle 模式） */
  trailing?: boolean
}

/**
 * 对象池配置
 */
export interface ObjectPoolConfig {
  /** 初始池大小 */
  initialSize?: number
  /** 最大池大小 */
  maxSize?: number
}

/**
 * 通用对象池实现
 * 用于减少频繁创建销毁对象的开销
 * @private
 */
class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => void
  private maxSize: number

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    config: ObjectPoolConfig = {}
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = config.maxSize ?? 100

    // 预创建对象
    const initialSize = config.initialSize ?? 10
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory())
    }
  }

  acquire(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.factory()
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj)
      this.pool.push(obj)
    }
  }

  clear(): void {
    this.pool.length = 0
  }

  get size(): number {
    return this.pool.length
  }
}

/**
 * 一次性事件处理器包装器
 * 用于标识和管理 once 监听器,防止内存泄漏
 * @private
 */
interface OnceWrapper<T = EventPayload> {
  /** 原始处理器 */
  original: EventHandler<T>
  /** 包装后的处理器 */
  wrapped: EventHandler<T>
}

/**
 * 批量事件项
 */
interface BatchEventItem {
  /** 事件名称 */
  event: string
  /** 事件数据 */
  payload?: EventPayload
}

/**
 * LRU 缓存节点
 * @private
 */
interface CacheNode {
  key: string
  value: RegExp
  prev: CacheNode | null
  next: CacheNode | null
}

/**
 * LRU 缓存实现
 * 用于缓存通配符模式的正则表达式
 * @private
 */
class LRUCache {
  private capacity: number
  private cache = new Map<string, CacheNode>()
  private head: CacheNode | null = null
  private tail: CacheNode | null = null

  constructor(capacity: number = 50) {
    this.capacity = capacity
  }

  get(key: string): RegExp | undefined {
    const node = this.cache.get(key)
    if (!node) return undefined

    // 移动到头部
    this.moveToHead(node)
    return node.value
  }

  set(key: string, value: RegExp): void {
    const node = this.cache.get(key)

    if (node) {
      // 更新现有节点
      node.value = value
      this.moveToHead(node)
    } else {
      // 创建新节点
      const newNode: CacheNode = { key, value, prev: null, next: null }
      this.cache.set(key, newNode)
      this.addToHead(newNode)

      // 检查容量
      if (this.cache.size > this.capacity) {
        const removed = this.removeTail()
        if (removed) {
          this.cache.delete(removed.key)
        }
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.head = null
    this.tail = null
  }

  private addToHead(node: CacheNode): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  private moveToHead(node: CacheNode): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  private removeTail(): CacheNode | null {
    if (!this.tail) return null
    const node = this.tail
    this.removeNode(node)
    return node
  }
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
/**
 * 模式监听器接口
 */
interface PatternListener {
  /** 正则表达式 */
  regex: RegExp
  /** 处理器 */
  handler: EventHandler<EventPayload>
  /** 优先级 */
  priority?: number
}

/**
 * 优先级事件处理器接口
 */
interface PriorityEventHandler<T = EventPayload> {
  /** 处理器函数 */
  handler: EventHandler<T>
  /** 优先级（数值越大优先级越高） */
  priority: number
}

export class CoreEventManager implements EventManager {
  /** 事件处理器存储 - 每个事件对应优先级处理器数组 */
  private events = new Map<string, PriorityEventHandler<EventPayload>[]>()

  /** 一次性事件处理器映射 - 用于正确清理 once 监听器 */
  private onceWrappers = new Map<string, Map<EventHandler<EventPayload>, OnceWrapper<EventPayload>>>()

  /** 模式监听器存储 - 支持通配符事件监听 */
  private patternListeners = new Map<string, Set<PatternListener>>()

  /** 模式前缀索引 - 性能优化：快速定位相关模式 */
  private patternPrefixIndex = new Map<string, Set<PatternListener>>()

  /** 最大监听器数量警告阈值 - 防止内存泄漏 */
  private maxListeners = 100

  /** 通配符正则表达式 LRU 缓存 - 性能优化 */
  private regexCache = new LRUCache(50)

  /** 批处理标志 */
  private batching = false

  /** 批处理队列 */
  private batchQueue: BatchEventItem[] = []

  /** 待清理的空事件集合 - 延迟清理优化 */
  private pendingCleanup = new Set<string>()

  /** 清理定时器 */
  private cleanupTimer?: ReturnType<typeof setTimeout>

  /** 修复:待清理队列的最大大小限制,防止内存泄漏 */
  private readonly maxPendingCleanup = 100

  /** 性能优化:事件触发计数器,用于统计和性能分析 */
  private eventTriggerCount = new Map<string, number>()

  /** 性能优化:最后一次清理时间 */
  private lastCleanupTime = Date.now()

  /** 节流处理器存储 */
  private throttledHandlers = new Map<string, Map<EventHandler<EventPayload>, {
    wrapper: EventHandler<EventPayload>
    timer?: ReturnType<typeof setTimeout>
    lastCall: number
    pending?: EventPayload
  }>>()

  /** 防抖处理器存储 */
  private debouncedHandlers = new Map<string, Map<EventHandler<EventPayload>, {
    wrapper: EventHandler<EventPayload>
    timer?: ReturnType<typeof setTimeout>
  }>>()

  /** 事件处理器数组池 - 减少数组创建开销 */
  private handlerArrayPool = new ObjectPool<PriorityEventHandler<EventPayload>[]>(
    () => [],
    (arr) => { arr.length = 0 },
    { initialSize: 20, maxSize: 50 }
  )

  /** 微任务队列 - 延迟执行优化 */
  private microTaskQueue: Array<{ event: string; payload: EventPayload }> = []
  private microTaskScheduled = false

  /**
   * 触发事件
   *
   * 性能优化:
   * - 没有监听器时快速返回
   * - 错误隔离,单个处理器错误不影响其他处理器
   * - 支持通配符模式匹配
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
   *
   * // 会触发 'user:*' 和 '*' 的监听器
   * ```
   */
  emit<T = EventPayload>(event: string, payload?: T): void {
    // 性能优化:统计事件触发次数
    const count = this.eventTriggerCount.get(event) || 0
    this.eventTriggerCount.set(event, count + 1)

    // 1. 触发精确匹配的监听器(按优先级排序)
    const handlers = this.events.get(event)

    if (handlers && handlers.length > 0) {
      // 按优先级执行(已排序,直接遍历)
      for (const { handler } of handlers) {
        try {
          handler(payload)
        } catch (error) {
          // 错误隔离: 单个处理器错误不影响其他处理器
          console.error(`Error in event handler for "${event}":`, error)
        }
      }
    }

    // 2. 触发模式匹配的监听器（优化版本：使用前缀索引）
    if (this.patternPrefixIndex.size > 0) {
      const relevantListeners = this.getRelevantPatternListeners(event)

      relevantListeners.forEach(({ regex, handler }) => {
        if (regex.test(event)) {
          try {
            handler(payload)
          } catch (error) {
            console.error(`Error in pattern handler for "${event}":`, error)
          }
        }
      })
    }
  }

  /**
   * 获取与事件相关的模式监听器
   *
   * 性能优化: 使用前缀索引快速定位相关监听器
   *
   * @param event - 事件名称
   * @returns 相关的模式监听器集合
   * @private
   */
  private getRelevantPatternListeners(event: string): Set<PatternListener> {
    const relevant = new Set<PatternListener>()

    // 1. 添加全局监听器 (*)
    const globalListeners = this.patternPrefixIndex.get('*')
    if (globalListeners) {
      globalListeners.forEach(listener => relevant.add(listener))
    }

    // 2. 提取事件前缀（冒号分隔）
    const parts = event.split(':')
    for (let i = 0; i < parts.length; i++) {
      const prefix = parts.slice(0, i + 1).join(':')
      const prefixListeners = this.patternPrefixIndex.get(prefix)
      if (prefixListeners) {
        prefixListeners.forEach(listener => relevant.add(listener))
      }
    }

    // 3. 添加精确匹配前缀的监听器
    const exactListeners = this.patternPrefixIndex.get(event)
    if (exactListeners) {
      exactListeners.forEach(listener => relevant.add(listener))
    }

    return relevant
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
  async emitAsync<T = EventPayload>(event: string, payload?: T): Promise<void> {
    const handlers = this.events.get(event)

    if (!handlers || handlers.length === 0) {
      return
    }

    // 并行执行所有处理器（按优先级排序）
    await Promise.allSettled(
      handlers.map(async ({ handler }) => {
        try {
          await handler(payload)
        } catch (error) {
          console.error(`Error in async event handler for "${event}":`, error)
        }
      })
    )
  }

  /**
   * 批量触发事件
   *
   * 性能优化: 一次性触发多个事件，减少遍历开销
   *
   * @param events - 事件数组
   *
   * @example
   * ```typescript
   * eventManager.emitBatch([
   *   { event: 'user:login', payload: { id: 1 } },
   *   { event: 'log:info', payload: { message: 'User logged in' } },
   *   { event: 'analytics:track', payload: { action: 'login' } }
   * ])
   * ```
   */
  emitBatch(events: BatchEventItem[]): void {
    // 标记进入批处理模式
    this.batching = true
    this.batchQueue = []

    try {
      // 收集所有需要触发的事件
      events.forEach(({ event, payload }) => {
        this.batchQueue.push({ event, payload })
      })

      // 批量执行
      this.batchQueue.forEach(({ event, payload }) => {
        this.emit(event, payload)
      })
    } finally {
      // 退出批处理模式
      this.batching = false
      this.batchQueue = []
    }
  }

  /**
   * 异步批量触发事件
   *
   * @param events - 事件数组
   *
   * @example
   * ```typescript
   * await eventManager.emitBatchAsync([
   *   { event: 'data:save', payload: data1 },
   *   { event: 'data:save', payload: data2 }
   * ])
   * ```
   */
  async emitBatchAsync(events: BatchEventItem[]): Promise<void> {
    await Promise.all(
      events.map(({ event, payload }) => this.emitAsync(event, payload))
    )
  }

  /**
   * 监听事件
   *
   * 支持通配符模式:
   * - `user:*` 监听所有 user 相关事件
   * - `*` 监听所有事件
   *
   * @param event - 事件名称（支持通配符 *）
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * // 精确监听
   * const unsubscribe = eventManager.on('message', (msg) => {
   *   console.log('Received:', msg)
   * })
   *
   * // 通配符监听
   * eventManager.on('user:*', (data) => {
   *   console.log('User event:', data)
   * })
   *
   * // 监听所有事件
   * eventManager.on('*', (data) => {
   *   console.log('Any event:', data)
   * })
   *
   * // 取消监听
   * unsubscribe()
   * ```
   */
  /**
   * 监听事件（支持优先级）
   *
   * @param event - 事件名称（支持通配符 *）
   * @param handler - 事件处理器
   * @param priority - 优先级（数值越大优先级越高，默认 0）
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * // 普通监听
   * eventManager.on('message', handler)
   *
   * // 高优先级监听（先执行）
   * eventManager.on('message', importantHandler, 100)
   *
   * // 低优先级监听（后执行）
   * eventManager.on('message', logHandler, -10)
   * ```
   */
  on<T = EventPayload>(event: string, handler: EventHandler<T>, priority = 0): Unsubscribe {
    // 支持通配符模式
    if (event.includes('*')) {
      return this.onPattern(event, handler, priority)
    }

    // 精确匹配模式
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }

    const handlers = this.events.get(event)!

    // 创建优先级处理器
    const priorityHandler: PriorityEventHandler<EventPayload> = {
      handler: handler as EventHandler<EventPayload>,
      priority
    }

    // 按优先级插入（降序排列）
    const insertIndex = handlers.findIndex(h => h.priority < priority)
    if (insertIndex === -1) {
      handlers.push(priorityHandler)
    } else {
      handlers.splice(insertIndex, 0, priorityHandler)
    }

    // 内存泄漏警告
    if (handlers.length > this.maxListeners) {
      console.warn(
        `Possible memory leak detected: ${handlers.length} listeners for event "${event}". ` +
        `Consider using once() or removing unused listeners.`
      )
    }

    // 返回取消监听函数
    return () => this.off(event, handler as EventHandler<EventPayload>)
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
  once<T = EventPayload>(event: string, handler: EventHandler<T>): Unsubscribe {
    // 创建包装函数
    const wrappedHandler: EventHandler<T> = (payload: T) => {
      // 先移除监听器
      this.off(event, handler as EventHandler<EventPayload>)

      // 再执行处理器
      handler(payload)
    }

    // 保存包装器映射,用于正确清理
    if (!this.onceWrappers.has(event)) {
      this.onceWrappers.set(event, new Map())
    }
    this.onceWrappers.get(event)!.set(handler as EventHandler<EventPayload>, {
      original: handler as EventHandler<EventPayload>,
      wrapped: wrappedHandler as EventHandler<EventPayload>,
    })

    // 注册包装后的处理器
    this.on(event, wrappedHandler)

    // 返回取消监听函数
    return () => this.off(event, handler as EventHandler<EventPayload>)
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
  off(event: string, handler?: EventHandler<EventPayload>): void {
    if (!handler) {
      // 移除所有监听器
      this.events.delete(event)
      // 清理 once 包装器
      this.onceWrappers.delete(event)
      return
    }

    const handlers = this.events.get(event)
    if (!handlers) {
      return
    }

    // 检查是否是 once 监听器
    const wrappers = this.onceWrappers.get(event)
    if (wrappers?.has(handler)) {
      const wrapper = wrappers.get(handler)!
      // 移除包装后的处理器
      const index = handlers.findIndex(h => h.handler === wrapper.wrapped)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
      wrappers.delete(handler)

      // 清理空的包装器映射
      if (wrappers.size === 0) {
        this.onceWrappers.delete(event)
      }
    } else {
      // 移除普通监听器
      const index = handlers.findIndex(h => h.handler === handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }

    // 修复：内存优化 - 清理空的事件数组并调度延迟清理
    if (handlers.length === 0) {
      this.pendingCleanup.add(event)
      this.scheduleCleanup()
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
    // 清理所有处理器数组
    this.events.clear()

    // 清理所有 once 包装器
    this.onceWrappers.forEach(wrappers => wrappers.clear())
    this.onceWrappers.clear()

    // 清理正则缓存
    this.regexCache.clear()

    // 清理模式监听器
    this.patternListeners.clear()

    // 清理模式前缀索引
    this.patternPrefixIndex.forEach(set => set.clear())
    this.patternPrefixIndex.clear()

    // 清理待清理列表
    this.pendingCleanup.clear()

    // 清理定时器
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer)
      this.cleanupTimer = undefined
    }

    // 清理统计数据
    this.eventTriggerCount.clear()

    // 清理节流和防抖处理器
    this.throttledHandlers.forEach(handlers => {
      handlers.forEach(h => {
        if (h.timer) clearTimeout(h.timer)
      })
      handlers.clear()
    })
    this.throttledHandlers.clear()

    this.debouncedHandlers.forEach(handlers => {
      handlers.forEach(h => {
        if (h.timer) clearTimeout(h.timer)
      })
      handlers.clear()
    })
    this.debouncedHandlers.clear()

    // 清理对象池
    this.handlerArrayPool.clear()

    // 清理微任务队列
    this.microTaskQueue.length = 0
    this.microTaskScheduled = false
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
    return this.events.get(event)?.length ?? 0
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

  /**
   * 模式匹配监听（内部方法）
   *
   * 支持通配符事件监听，如 'user:*' 或 '*'
   * 性能优化：使用前缀索引加速匹配
   *
   * @private
   * @param pattern - 事件模式（包含通配符）
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   */
  private onPattern<T = EventPayload>(pattern: string, handler: EventHandler<T>, priority = 0): Unsubscribe {
    const regex = this.patternToRegex(pattern)

    // 创建模式监听器对象
    const patternListener: PatternListener = {
      regex,
      handler: handler as EventHandler<EventPayload>,
      priority
    }

    // 存储模式监听器
    if (!this.patternListeners.has(pattern)) {
      this.patternListeners.set(pattern, new Set())
    }

    this.patternListeners.get(pattern)!.add(patternListener)

    // 性能优化：构建前缀索引
    this.indexPatternListener(pattern, patternListener)

    // 返回取消监听函数
    return () => {
      const listeners = this.patternListeners.get(pattern)
      if (listeners) {
        // 需要找到并删除匹配的监听器
        for (const listener of listeners) {
          if (listener.handler === handler) {
            listeners.delete(listener)
            // 从前缀索引中移除
            this.unindexPatternListener(pattern, listener)
            break
          }
        }

        // 如果没有监听器了，删除整个模式
        if (listeners.size === 0) {
          this.patternListeners.delete(pattern)
        }
      }
    }
  }

  /**
   * 为模式监听器建立前缀索引
   *
   * @param pattern - 事件模式
   * @param listener - 模式监听器
   * @private
   */
  private indexPatternListener(pattern: string, listener: PatternListener): void {
    // 提取模式前缀（通配符之前的部分）
    const prefix = pattern.split('*')[0]

    // 如果是全局监听器 (*)
    if (prefix === '' || prefix === '*') {
      if (!this.patternPrefixIndex.has('*')) {
        this.patternPrefixIndex.set('*', new Set())
      }
      this.patternPrefixIndex.get('*')!.add(listener)
      return
    }

    // 移除末尾的冒号
    const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix

    if (!this.patternPrefixIndex.has(cleanPrefix)) {
      this.patternPrefixIndex.set(cleanPrefix, new Set())
    }
    this.patternPrefixIndex.get(cleanPrefix)!.add(listener)
  }

  /**
   * 从前缀索引中移除模式监听器
   *
   * @param pattern - 事件模式
   * @param listener - 模式监听器
   * @private
   */
  private unindexPatternListener(pattern: string, listener: PatternListener): void {
    const prefix = pattern.split('*')[0]

    const key = (prefix === '' || prefix === '*')
      ? '*'
      : (prefix.endsWith(':') ? prefix.slice(0, -1) : prefix)

    const indexSet = this.patternPrefixIndex.get(key)
    if (indexSet) {
      indexSet.delete(listener)
      if (indexSet.size === 0) {
        this.patternPrefixIndex.delete(key)
      }
    }
  }

  /**
   * 获取事件统计信息
   *
   * @returns 事件统计对象
   *
   * @example
   * ```typescript
   * const stats = eventManager.getStats()
   * console.log('事件总数:', stats.totalEvents)
   * console.log('监听器总数:', stats.totalListeners)
   * ```
   */
  getStats(): {
    totalEvents: number
    totalListeners: number
    totalPatternListeners: number
    events: Array<{ name: string; listenerCount: number; triggerCount?: number }>
    topTriggeredEvents: Array<{ name: string; count: number }>
  } {
    const events: Array<{ name: string; listenerCount: number; triggerCount?: number }> = []
    let totalListeners = 0

    this.events.forEach((handlers, name) => {
      const count = handlers.length
      const triggerCount = this.eventTriggerCount.get(name)
      events.push({ name, listenerCount: count, triggerCount })
      totalListeners += count
    })

    let totalPatternListeners = 0
    this.patternListeners.forEach(listeners => {
      totalPatternListeners += listeners.size
    })

    // 获取触发次数最多的事件
    const topTriggered = Array.from(this.eventTriggerCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    return {
      totalEvents: this.events.size,
      totalListeners,
      totalPatternListeners,
      events: events.sort((a, b) => b.listenerCount - a.listenerCount),
      topTriggeredEvents: topTriggered,
    }
  }

  /**
   * 将通配符模式转换为正则表达式
   *
   * 转换规则:
   * - `*` 匹配任意字符（除了 :）
   * - `**` 匹配任意字符（包括 :）
   * - 其他字符按字面量匹配
   *
   * @private
   * @param pattern - 通配符模式
   * @returns 正则表达式
   *
   * @example
   * ```typescript
   * patternToRegex('user:*')     // /^user:[^:]*$/
   * patternToRegex('*')          // /^[^:]*$/
   * patternToRegex('user:**')    // /^user:.*$/
   * ```
   */
  private patternToRegex(pattern: string): RegExp {
    // 性能优化: 使用 LRU 缓存
    const cached = this.regexCache.get(pattern)
    if (cached) {
      return cached
    }

    // 转义正则表达式特殊字符（除了 *）
    let escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

    // 使用占位符保护 ** (避免被后续的 * 替换影响)
    const DOUBLE_STAR_PLACEHOLDER = '___DOUBLE_STAR___'
    escaped = escaped.replace(/\*\*/g, DOUBLE_STAR_PLACEHOLDER)

    // 处理单个 * (匹配任意字符，除了 :)
    escaped = escaped.replace(/\*/g, '[^:]*')

    // 恢复 ** 为 .* (匹配任意字符，包括 :)
    escaped = escaped.replace(new RegExp(DOUBLE_STAR_PLACEHOLDER, 'g'), '.*')

    // 添加开始和结束锚点
    const regex = new RegExp(`^${escaped}$`)

    // 缓存结果
    this.regexCache.set(pattern, regex)

    return regex
  }

  /**
   * 启动延迟清理
   *
   * 性能优化: 延迟清理空的事件集合，避免频繁的 Map 操作
   *
   * @private
   */
  private scheduleCleanup(): void {
    // 修复：如果待清理队列超过限制，立即执行清理
    if (this.pendingCleanup.size >= this.maxPendingCleanup) {
      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer)
        this.cleanupTimer = undefined
      }
      this.performCleanup()
      return
    }

    // 修复：重置定时器，确保高频场景下定时器能正确触发
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer)
    }

    this.cleanupTimer = setTimeout(() => {
      this.performCleanup()
      this.cleanupTimer = undefined
    }, 1000) // 1秒后执行清理
  }

  /**
   * 执行清理操作
   *
   * @private
   */
  private performCleanup(): void {
    this.pendingCleanup.forEach(event => {
      const handlers = this.events.get(event)
      if (handlers && handlers.length === 0) {
        this.events.delete(event)
      }
    })
    this.pendingCleanup.clear()
  }

  /**
   * 带节流的事件监听
   *
   * 性能优化: 限制处理器的调用频率
   *
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @param options - 节流选项
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * // 最多每100ms触发一次
   * eventManager.onThrottled('scroll', handleScroll, { delay: 100 })
   *
   * // 前沿触发（立即执行第一次）
   * eventManager.onThrottled('resize', handleResize, {
   *   delay: 200,
   *   leading: true,
   *   trailing: false
   * })
   * ```
   */
  onThrottled<T = EventPayload>(
    event: string,
    handler: EventHandler<T>,
    options: ThrottleOptions
  ): Unsubscribe {
    const { delay, leading = true, trailing = true } = options

    if (!this.throttledHandlers.has(event)) {
      this.throttledHandlers.set(event, new Map())
    }

    const throttledWrapper: EventHandler<EventPayload> = (payload) => {
      const handlerData = this.throttledHandlers.get(event)?.get(handler as EventHandler<EventPayload>)
      if (!handlerData) return

      const now = Date.now()
      const timeSinceLastCall = now - handlerData.lastCall

      if (timeSinceLastCall >= delay) {
        // 可以立即执行
        if (leading || handlerData.lastCall !== 0) {
          handlerData.lastCall = now
          handler(payload as T)
        }
      } else if (trailing) {
        // 保存待执行的负载
        handlerData.pending = payload

        // 设置延迟执行
        if (!handlerData.timer) {
          handlerData.timer = setTimeout(() => {
            handlerData.timer = undefined
            if (handlerData.pending !== undefined) {
              handlerData.lastCall = Date.now()
              handler(handlerData.pending as T)
              handlerData.pending = undefined
            }
          }, delay - timeSinceLastCall)
        }
      }
    }

    this.throttledHandlers.get(event)!.set(handler as EventHandler<EventPayload>, {
      wrapper: throttledWrapper,
      lastCall: 0
    })

    // 注册包装后的处理器
    return this.on(event, throttledWrapper)
  }

  /**
   * 带防抖的事件监听
   *
   * 性能优化: 延迟执行，直到事件停止触发
   *
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @param delay - 延迟时间（毫秒）
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * // 输入停止 300ms 后触发
   * eventManager.onDebounced('input', handleInput, 300)
   * ```
   */
  onDebounced<T = EventPayload>(
    event: string,
    handler: EventHandler<T>,
    delay: number
  ): Unsubscribe {
    if (!this.debouncedHandlers.has(event)) {
      this.debouncedHandlers.set(event, new Map())
    }

    const debouncedWrapper: EventHandler<EventPayload> = (payload) => {
      const handlerData = this.debouncedHandlers.get(event)?.get(handler as EventHandler<EventPayload>)
      if (!handlerData) return

      // 清除之前的定时器
      if (handlerData.timer) {
        clearTimeout(handlerData.timer)
      }

      // 设置新的定时器
      handlerData.timer = setTimeout(() => {
        handlerData.timer = undefined
        handler(payload as T)
      }, delay)
    }

    this.debouncedHandlers.get(event)!.set(handler as EventHandler<EventPayload>, {
      wrapper: debouncedWrapper
    })

    // 注册包装后的处理器
    return this.on(event, debouncedWrapper)
  }

  /**
   * 延迟触发事件（微任务队列）
   *
   * 性能优化: 将事件触发延迟到微任务中执行，
   * 可以合并同一帧内的多次触发
   *
   * @param event - 事件名称
   * @param payload - 事件数据
   *
   * @example
   * ```typescript
   * // 延迟到微任务中执行
   * eventManager.emitDeferred('update', data)
   * eventManager.emitDeferred('update', data2) // 会合并执行
   * ```
   */
  emitDeferred<T = EventPayload>(event: string, payload?: T): void {
    this.microTaskQueue.push({ event, payload })

    if (!this.microTaskScheduled) {
      this.microTaskScheduled = true
      queueMicrotask(() => this.flushMicroTaskQueue())
    }
  }

  /**
   * 刷新微任务队列
   *
   * @private
   */
  private flushMicroTaskQueue(): void {
    this.microTaskScheduled = false

    // 复制队列并清空
    const queue = this.microTaskQueue.slice()
    this.microTaskQueue.length = 0

    // 使用 Map 去重，保留最后一次的 payload
    const eventMap = new Map<string, EventPayload>()
    for (const item of queue) {
      eventMap.set(item.event, item.payload)
    }

    // 按顺序触发去重后的事件
    for (const [event, payload] of eventMap) {
      this.emit(event, payload)
    }
  }

  /**
   * 获取对象池统计信息
   *
   * @returns 对象池统计
   */
  getPoolStats(): { handlerArrayPoolSize: number } {
    return {
      handlerArrayPoolSize: this.handlerArrayPool.size
    }
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

