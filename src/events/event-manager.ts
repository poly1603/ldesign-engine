import type {
  EventHandler,
  EventManager,
  EventMap,
  Logger,
} from '../types'

interface EventListener {
  handler: EventHandler
  once: boolean
  priority: number
}

// 事件对象池，用于减少内存分配
class EventObjectPool {
  private pool: EventListener[] = []
  private maxSize = 100

  get(): EventListener {
    return this.pool.pop() || { handler: () => { }, once: false, priority: 0 }
  }

  release(obj: EventListener): void {
    if (this.pool.length < this.maxSize) {
      // 重置对象状态
      obj.handler = () => { }
      obj.once = false
      obj.priority = 0
      this.pool.push(obj)
    }
  }

  clear(): void {
    this.pool.length = 0
  }
}

export class EventManagerImpl<TEventMap extends EventMap = EventMap>
  implements EventManager<TEventMap> {
  private events: Map<string, EventListener[]> = new Map()
  private maxListeners = 50
  private sortedListenersCache: Map<string, EventListener[]> = new Map()
  private eventStats: Map<string, { count: number; lastEmit: number }> =
    new Map()
  private eventPool = new EventObjectPool() // 事件对象池

  // 性能优化：使用WeakMap减少内存占用
  private weakSortedCache = new WeakMap<EventListener[], EventListener[]>()
  private maxEventStats = 1000 // 限制统计数据数量
  private cleanupInterval = 60000 // 降低到1分钟
  private cleanupTimer: number | null = null // 存储定时器引用

  // 🚀 新增：优先级桶优化 - 按优先级分组存储监听器
  private priorityBuckets: Map<string, Map<number, EventListener[]>> = new Map()
  private hasPriorityListeners: Map<string, boolean> = new Map()

  constructor(private logger?: Logger) {
    // 更频繁地清理统计数据
    this.setupCleanupTimer()
  }

  private setupCleanupTimer(): void {
    // 清理旧定时器（防止重复创建）
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer)
    }

    // 使用 window.setInterval 获得正确类型，便于清理
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupStats()
      // 检测内存使用情况
      this.checkMemoryUsage()
    }, this.cleanupInterval)
  }

  // 重载：类型安全事件 + 通用字符串事件
  on<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>
  ): void
  on<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>,
    priority: number
  ): void
  on(event: string, handler: EventHandler): void
  on(event: string, handler: EventHandler, priority: number): void
  on(event: unknown, handler: unknown, priority = 0): void {
    this.addEventListener(String(event), handler as EventHandler, false, priority)
  }

  // 重载：类型安全事件 + 通用字符串事件
  off<K extends keyof TEventMap>(
    event: K,
    handler?: EventHandler<TEventMap[K]>
  ): void
  off(event: string, handler?: EventHandler): void
  off(event: unknown, handler?: unknown): void {
    const key = String(event)
    if (!this.events.has(key)) {
      return
    }

    const listeners = this.events.get(key)
    if (!listeners) {
      return
    }

    if (!handler) {
      // 移除所有监听器
      // 🚀 清理优先级桶
      this.events.delete(key)
      this.sortedListenersCache.delete(key)
      this.priorityBuckets.delete(key)
      this.hasPriorityListeners.delete(key)

      // 释放所有监听器到对象池
      for (const listener of listeners) {
        this.eventPool.release(listener)
      }
      return
    }

    // 移除指定监听器
    const index = listeners.findIndex(listener => listener.handler === handler)
    if (index > -1) {
      const listener = listeners[index]
      this.eventPool.release(listener)
      listeners.splice(index, 1)

      // 🚀 同时从优先级桶中移除
      if (listener.priority !== 0) {
        const buckets = this.priorityBuckets.get(key)
        if (buckets) {
          const bucket = buckets.get(listener.priority)
          if (bucket) {
            const bucketIndex = bucket.indexOf(listener)
            if (bucketIndex > -1) {
              bucket.splice(bucketIndex, 1)
            }
            if (bucket.length === 0) {
              buckets.delete(listener.priority)
            }
          }
          if (buckets.size === 0) {
            this.priorityBuckets.delete(key)
            this.hasPriorityListeners.set(key, false)
          }
        }
      }

      if (listeners.length === 0) {
        this.events.delete(key)
        this.sortedListenersCache.delete(key)
        this.priorityBuckets.delete(key)
        this.hasPriorityListeners.delete(key)
      } else {
        this.sortedListenersCache.delete(key)
      }
    }
  }

  // 重载：类型安全事件 + 通用字符串事件
  emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void
  emit(event: string, ...args: unknown[]): void
  emit(event: unknown, ...args: unknown[]): void {
    const key = String(event)
    this.updateEventStats(key)

    const listeners = this.events.get(key)
    if (!listeners || listeners.length === 0) {
      return
    }

    // 🚀 快速路径1：单个监听器，无需排序
    if (listeners.length === 1) {
      const listener = listeners[0]
      try {
        listener.handler(args[0] as unknown)
      } catch (error) {
        this.logger?.error(`Error in event handler for "${key}":`, error)
      }
      if (listener.once) {
        this.events.delete(key)
        this.eventPool.release(listener)
        this.priorityBuckets.delete(key)
        this.hasPriorityListeners.delete(key)
      }
      return
    }

    // 🚀 快速路径2：所有监听器优先级相同（最常见情况）
    const hasPriority = this.hasPriorityListeners.get(key)
    if (!hasPriority) {
      // 直接遍历，无需排序
      const toRemove: number[] = []
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i]
        try {
          listener.handler(args[0] as unknown)
        } catch (error) {
          this.logger?.error('Error in event handler for "' + key + '":', error)
        }
        if (listener.once) {
          toRemove.push(i)
        }
      }

      // 清理一次性监听器
      if (toRemove.length > 0) {
        for (let i = toRemove.length - 1; i >= 0; i--) {
          const idx = toRemove[i]
          this.eventPool.release(listeners[idx])
          listeners.splice(idx, 1)
        }
        if (listeners.length === 0) {
          this.events.delete(key)
        }
      }
      return
    }

    // 🚀 优先级桶路径：使用预排序的桶
    const buckets = this.priorityBuckets.get(key)
    if (buckets) {
      // 按优先级从高到低遍历桶
      const priorities = Array.from(buckets.keys()).sort((a, b) => a - b)
      const toRemove: Array<{ priority: number; index: number }> = []

      for (const priority of priorities) {
        const bucket = buckets.get(priority)!
        for (let i = 0; i < bucket.length; i++) {
          const listener = bucket[i]
          try {
            listener.handler(args[0] as unknown)
          } catch (error) {
            this.logger?.error('Error in event handler for "' + key + '":', error)
          }
          if (listener.once) {
            toRemove.push({ priority, index: i })
          }
        }
      }

      // 清理一次性监听器
      if (toRemove.length > 0) {
        // 倒序删除避免索引偏移
        for (let i = toRemove.length - 1; i >= 0; i--) {
          const { priority, index } = toRemove[i]
          const bucket = buckets.get(priority)!
          const listener = bucket[index]
          this.eventPool.release(listener)
          bucket.splice(index, 1)

          // 同时从主数组中删除
          const mainIdx = listeners.indexOf(listener)
          if (mainIdx > -1) {
            listeners.splice(mainIdx, 1)
          }

          // 如果桶为空，删除桶
          if (bucket.length === 0) {
            buckets.delete(priority)
          }
        }

        // 如果所有桶都空了，清理
        if (buckets.size === 0) {
          this.events.delete(key)
          this.priorityBuckets.delete(key)
          this.hasPriorityListeners.delete(key)
        }
      }
      return
    }

    // 降级路径：原始排序逻辑（仅作为后备）
    let listenersToExecute = this.weakSortedCache.get(listeners)
    if (!listenersToExecute) {
      if (listeners.length < 10) {
        listenersToExecute = this.insertionSort([...listeners])
      } else {
        listenersToExecute = [...listeners].sort((a, b) => b.priority - a.priority)
      }
      this.weakSortedCache.set(listeners, listenersToExecute)
    }

    const removeIndexes = new Uint8Array(listenersToExecute.length)
    let hasOnceListeners = false

    for (let i = 0; i < listenersToExecute.length; i++) {
      const listener = listenersToExecute[i]
      try {
        listener.handler(args[0] as unknown)
      } catch (error) {
        this.logger?.error('Error in event handler for "' + key + '":', error)
      }
      if (listener.once) {
        removeIndexes[i] = 1
        hasOnceListeners = true
      }
    }

    if (hasOnceListeners) {
      this.batchRemoveIndexedListeners(key, listeners, removeIndexes)
    }
  }

  // 重载：类型安全事件 + 通用字符串事件
  once<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>
  ): void
  once<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>,
    priority: number
  ): void
  once(event: string, handler: EventHandler): void
  once(event: string, handler: EventHandler, priority: number): void
  once(event: unknown, handler: unknown, priority = 0): void {
    this.addEventListener(String(event), handler as EventHandler, true, priority)
  }

  private addEventListener(
    event: string,
    handler: EventHandler,
    once: boolean,
    priority: number
  ): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
      this.hasPriorityListeners.set(event, false)
    }

    const listeners = this.events.get(event)
    if (!listeners) return

    // 检查监听器数量限制
    if (listeners.length >= this.maxListeners) {
      this.logger?.warn(
        'MaxListenersExceededWarning: Possible EventManager memory leak detected. ' +
        (listeners.length + 1) + ' "' + event + '" listeners added. ' +
        'Use setMaxListeners() to increase limit.'
      )
    }

    // 使用对象池来减少内存分配
    const listener = this.eventPool.get()
    listener.handler = handler
    listener.once = once
    listener.priority = priority

    listeners.push(listener)

    // 🚀 维护优先级桶
    if (priority !== 0) {
      // 标记该事件有优先级监听器
      this.hasPriorityListeners.set(event, true)

      // 获取或创建该事件的桶集合
      if (!this.priorityBuckets.has(event)) {
        this.priorityBuckets.set(event, new Map())
      }
      const buckets = this.priorityBuckets.get(event)!

      // 获取或创建对应优先级的桶
      if (!buckets.has(priority)) {
        buckets.set(priority, [])
      }
      buckets.get(priority)!.push(listener)
    } else {
      // 检查是否所有监听器都是默认优先级
      const allDefaultPriority = listeners.every(l => l.priority === 0)
      if (allDefaultPriority) {
        this.hasPriorityListeners.set(event, false)
        this.priorityBuckets.delete(event)
      }
    }

    // 清除该事件的缓存
    this.sortedListenersCache.delete(event)
  }

  // 获取事件的监听器数量
  listenerCount(event: string): number {
    const listeners = this.events.get(event)
    return listeners ? listeners.length : 0
  }

  // 获取所有事件名称
  eventNames(): string[] {
    return Array.from(this.events.keys())
  }

  // 获取指定事件的所有监听器
  listeners(event: string): EventHandler[] {
    const listeners = this.events.get(event)
    return listeners ? listeners.map(l => l.handler) : []
  }

  // 设置最大监听器数量
  setMaxListeners(n: number): void {
    this.maxListeners = n
  }

  // 获取最大监听器数量
  getMaxListeners(): number {
    return this.maxListeners
  }

  // 移除所有监听器
  removeAllListeners(event?: string): void {
    if (event) {
      // 释放监听器到对象池
      const listeners = this.events.get(event)
      if (listeners) {
        for (const listener of listeners) {
          this.eventPool.release(listener)
        }
      }

      this.events.delete(event)
      this.sortedListenersCache.delete(event)
      this.priorityBuckets.delete(event)
      this.hasPriorityListeners.delete(event)
    } else {
      // 释放所有监听器到对象池
      for (const listeners of this.events.values()) {
        for (const listener of listeners) {
          this.eventPool.release(listener)
        }
      }

      this.events.clear()
      this.sortedListenersCache.clear()
      this.priorityBuckets.clear()
      this.hasPriorityListeners.clear()
    }
  }

  // 在指定事件前添加监听器
  prependListener(event: string, handler: EventHandler, priority = 1000): void {
    this.addEventListener(event, handler, false, priority)
  }

  /**
   * 性能优化：更新事件统计
   */
  private updateEventStats(event: string): void {
    const stats = this.eventStats.get(event)
    const now = Date.now()

    if (stats) {
      stats.count++
      stats.lastEmit = now
    } else {
      this.eventStats.set(event, { count: 1, lastEmit: now })
    }
  }

  /**
   * 新方法：按索引批量移除监听器
   */
  private batchRemoveIndexedListeners(
    event: string,
    listeners: EventListener[],
    removeIndexes: Uint8Array
  ): void {
    // 按索引删除，倒序遍历避免索引偏移问题
    for (let i = removeIndexes.length - 1; i >= 0; i--) {
      if (removeIndexes[i] === 1) {
        // 使用对象池回收监听器对象
        this.eventPool.release(listeners[i])
        listeners.splice(i, 1)
      }
    }

    // 处理空事件监听器列表
    if (listeners.length === 0) {
      this.events.delete(event)
      this.sortedListenersCache.delete(event)
    } else {
      // 只有在必要时才更新缓存
      this.sortedListenersCache.delete(event)
      this.weakSortedCache.delete(listeners)
    }
  }

  /**
   * 性能优化：批量移除监听器
   */
  private batchRemoveListeners(
    event: string,
    listenersToRemove: EventListener[]
  ): void {
    const listeners = this.events.get(event)
    if (!listeners) return

    // 使用 Set 提高查找性能
    const removeSet = new Set(listenersToRemove.map(l => l.handler))

    // 过滤掉需要移除的监听器，并释放到对象池
    const filteredListeners = listeners.filter(l => {
      if (removeSet.has(l.handler)) {
        // 释放监听器对象到池中
        this.eventPool.release(l)
        return false
      }
      return true
    })

    if (filteredListeners.length === 0) {
      this.events.delete(event)
      this.sortedListenersCache.delete(event)
    } else {
      this.events.set(event, filteredListeners)
      this.sortedListenersCache.delete(event) // 清除缓存
      this.weakSortedCache.delete(listeners)
    }
  }

  /**
   * 性能优化：清理过期的统计数据 - 改进版
   */
  private cleanupStats(): void {
    const now = Date.now()
    const maxAge = 300000 // 5分钟

    // 检查事件统计数量
    if (this.eventStats.size > this.maxEventStats) {
      // 根据最后触发时间排序并只保留最近的事件
      const sortedEvents = Array.from(this.eventStats.entries())
        .sort((a, b) => b[1].lastEmit - a[1].lastEmit)
        .slice(0, this.maxEventStats - 100) // 留出一些缓冲空间

      this.eventStats.clear()
      for (const [event, stats] of sortedEvents) {
        this.eventStats.set(event, stats)
      }
    } else {
      // 正常的过期检查
      for (const [event, stats] of this.eventStats.entries()) {
        if (now - stats.lastEmit > maxAge) {
          this.eventStats.delete(event)
        }
      }
    }
  }

  /**
   * 检查内存使用
   */
  private checkMemoryUsage(): void {
    // 如果事件监听器总数超过警戒线，记录警告
    const stats = this.getStats()
    if (stats.totalListeners > 1000) {
      this.logger?.warn('High number of event listeners detected', {
        totalListeners: stats.totalListeners,
        events: Object.entries(stats.events)
          .filter(([, count]) => count > 20)
          .map(([event, count]) => `${event}: ${count}`)
      })
    }
  }

  /**
   * 获取事件统计信息
   */
  getEventStats(): Map<string, { count: number; lastEmit: number }> {
    return new Map(this.eventStats)
  }

  /**
   * 清理所有资源 - 增强版
   */
  cleanup(): void {
    this.events.clear()
    this.sortedListenersCache.clear()
    this.eventStats.clear()
  }

  /**
   * 销毁方法 - 确保完全清理
   */
  destroy(): void {
    // 清理定时器
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // 释放所有监听器到对象池
    for (const listeners of this.events.values()) {
      for (const listener of listeners) {
        this.eventPool.release(listener)
      }
    }

    // 清理所有数据
    this.events.clear()
    this.sortedListenersCache.clear()
    this.eventStats.clear()
    this.eventPool.clear()
    this.priorityBuckets.clear()
    this.hasPriorityListeners.clear()
  }

  prependOnceListener(
    event: string,
    handler: EventHandler,
    priority = 1000
  ): void {
    this.addEventListener(event, handler, true, priority)
  }

  namespace(ns: string): EventNamespace {
    return new EventNamespace(this, ns)
  }

  /**
   * 新增：批量事件操作
   * 一次性添加多个事件监听器
   */
  addListeners(listeners: Array<{
    event: string
    handler: EventHandler
    options?: { once?: boolean; priority?: number }
  }>): void {
    for (const { event, handler, options } of listeners) {
      this.addEventListener(event, handler, !!options?.once, options?.priority ?? 0)
    }
  }

  /**
   * 新增：事件管道
   * 支持事件的链式处理
   */
  pipe(sourceEvent: string, targetEvent: string, transform?: (data: unknown) => unknown): void {
    this.on(sourceEvent, (data) => {
      const transformedData = transform ? transform(data) : data
      this.emit(targetEvent, transformedData)
    })
  }

  /**
   * 新增：条件事件监听
   * 只有满足条件时才触发监听器
   */
  onWhen(
    event: string,
    condition: (data: unknown) => boolean,
    handler: EventHandler,
    options?: { once?: boolean; priority?: number }
  ): void {
    this.addEventListener(event, (data) => {
      if (condition(data)) {
        handler(data)
      }
    }, !!options?.once, options?.priority ?? 0)
  }

  /**
   * 新增：事件防抖
   * 在指定时间内只触发一次事件
   */
  debounce(event: string, delay: number = 300): EventDebouncer {
    return new EventDebouncer(this, event, delay)
  }

  /**
   * 新增：事件节流
   * 在指定时间间隔内最多触发一次事件
   */
  throttle(event: string, interval: number = 300): EventThrottler {
    return new EventThrottler(this, event, interval)
  }

  /**
   * 插入排序 - 对小数组更高效
   */
  private insertionSort(arr: EventListener[]): EventListener[] {
    for (let i = 1; i < arr.length; i++) {
      const current = arr[i]
      let j = i - 1
      while (j >= 0 && arr[j].priority < current.priority) {
        arr[j + 1] = arr[j]
        j--
      }
      arr[j + 1] = current
    }
    return arr
  }

  getStats(): {
    totalEvents: number
    totalListeners: number
    events: Record<string, number>
  } {
    const stats: Record<string, number> = {}
    let totalListeners = 0

    for (const [event, listeners] of this.events.entries()) {
      stats[event] = listeners.length
      totalListeners += listeners.length
    }

    return {
      totalEvents: this.events.size,
      totalListeners,
      events: stats,
    }
  }
}

export const ENGINE_EVENTS = {
  CREATED: 'engine:created',
  INSTALLED: 'engine:installed',
  MOUNTED: 'engine:mounted',
  UNMOUNTED: 'engine:unmounted',
  DESTROYED: 'engine:destroy',
  ERROR: 'engine:error',

  PLUGIN_REGISTERED: 'plugin:registered',
  PLUGIN_UNREGISTERED: 'plugin:unregistered',
  PLUGIN_ERROR: 'plugin:error',

  MIDDLEWARE_ADDED: 'middleware:added',
  MIDDLEWARE_REMOVED: 'middleware:removed',
  MIDDLEWARE_ERROR: 'middleware:error',

  STATE_CHANGED: 'state:changed',
  STATE_CLEARED: 'state:cleared',

  CONFIG_CHANGED: 'config:changed',

  ROUTE_CHANGED: 'route:changed',
  ROUTE_ERROR: 'route:error',

  THEME_CHANGED: 'theme:changed',

  LOCALE_CHANGED: 'locale:changed',
} as const

/**
 * 事件命名空间类 - 功能增强
 * 提供命名空间隔离的事件管理
 */
export class EventNamespace {
  constructor(
    private eventManager: EventManagerImpl,
    private namespace: string
  ) { }

  private getNamespacedEvent(event: string): string {
    return `${this.namespace}:${event}`
  }

  on(event: string, handler: EventHandler, priority?: number): void {
    this.eventManager.on(this.getNamespacedEvent(event), handler, priority ?? 0)
  }

  once(event: string, handler: EventHandler, priority?: number): void {
    this.eventManager.once(this.getNamespacedEvent(event), handler, priority ?? 0)
  }

  emit(event: string, data?: unknown): void {
    this.eventManager.emit(this.getNamespacedEvent(event), data)
  }

  off(event: string, handler?: EventHandler): void {
    this.eventManager.off(this.getNamespacedEvent(event), handler)
  }

  clear(): void {
    // 清理该命名空间下的所有事件
    const namespacedPrefix = `${this.namespace}:`
    const eventsToRemove: string[] = []

    for (const event of this.eventManager.eventNames()) {
      if (event.startsWith(namespacedPrefix)) {
        eventsToRemove.push(event)
      }
    }

    for (const event of eventsToRemove) {
      this.eventManager.removeAllListeners(event)
    }
  }
}

/**
 * 事件防抖器类 - 功能增强
 */
export class EventDebouncer {
  private timeoutId?: number
  private lastArgs?: unknown

  constructor(
    private eventManager: EventManagerImpl,
    private event: string,
    private delay: number
  ) { }

  emit(data?: unknown): void {
    this.lastArgs = data

    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
    }

    this.timeoutId = window.setTimeout(() => {
      this.eventManager.emit(this.event, this.lastArgs)
      this.timeoutId = undefined
    }, this.delay)
  }

  cancel(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
  }

  flush(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.eventManager.emit(this.event, this.lastArgs)
      this.timeoutId = undefined
    }
  }

  destroy(): void {
    this.cancel()
    this.lastArgs = undefined
  }
}

/**
 * 事件节流器类 - 功能增强
 */
export class EventThrottler {
  private lastEmitTime = 0
  private timeoutId?: number
  private lastArgs?: unknown

  constructor(
    private eventManager: EventManagerImpl,
    private event: string,
    private interval: number
  ) { }

  emit(data?: unknown): void {
    const now = Date.now()
    this.lastArgs = data

    if (now - this.lastEmitTime >= this.interval) {
      this.eventManager.emit(this.event, data)
      this.lastEmitTime = now
    } else if (!this.timeoutId) {
      // 设置延迟触发，确保最后一次调用会被执行
      const remainingTime = this.interval - (now - this.lastEmitTime)
      this.timeoutId = window.setTimeout(() => {
        this.eventManager.emit(this.event, this.lastArgs)
        this.lastEmitTime = Date.now()
        this.timeoutId = undefined
      }, remainingTime)
    }
  }

  cancel(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
  }

  destroy(): void {
    this.cancel()
    this.lastArgs = undefined
    this.lastEmitTime = 0
  }
}

// 在 EventManagerImpl 类中添加 destroy 方法（应该在类内部，这里作为补充导出）
export interface EventManagerWithDestroy<TEventMap extends EventMap = EventMap> extends EventManager<TEventMap> {
  destroy: () => void;
}

export function createEventManager<TEventMap extends EventMap = EventMap>(
  logger?: Logger
): EventManagerWithDestroy<TEventMap> {
  const manager = new EventManagerImpl<TEventMap>(logger);

  // 添加 destroy 方法
  (manager as any).destroy = function () {
    // 清理定时器
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // 清理所有事件监听器
    this.events.clear()

    // 清理缓存
    this.sortedListenersCache.clear()

    // 清理统计信息
    this.eventStats.clear()

    // 清理对象池
    this.eventPool.clear()
  };

  return manager as EventManagerWithDestroy<TEventMap>;
}
