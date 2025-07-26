import type { EventEmitter, EventHandler, UnsubscribeFn } from './types'

/**
 * 事件发射器实现
 * 提供高性能的事件发布订阅机制
 */
export class EventEmitterImpl implements EventEmitter {
  private events = new Map<string, Set<EventHandler>>()
  private onceEvents = new Map<string, Set<EventHandler>>()
  private maxListeners = 100

  /**
   * 发射事件
   */
  emit(event: string, ...args: any[]): void {
    // 处理普通监听器
    const handlers = this.events.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error)
        }
      }
    }

    // 处理一次性监听器
    const onceHandlers = this.onceEvents.get(event)
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in once event handler for '${event}':`, error)
        }
      }
      // 清除一次性监听器
      this.onceEvents.delete(event)
    }
  }

  /**
   * 添加事件监听器
   */
  on(event: string, handler: EventHandler): UnsubscribeFn {
    if (typeof handler !== 'function') {
      throw new TypeError('Event handler must be a function')
    }

    let handlers = this.events.get(event)
    if (!handlers) {
      handlers = new Set()
      this.events.set(event, handlers)
    }

    // 检查监听器数量限制
    if (handlers.size >= this.maxListeners) {
      console.warn(
        `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ` +
        `${handlers.size + 1} ${event} listeners added. ` +
        `Use setMaxListeners() to increase limit.`
      )
    }

    handlers.add(handler)

    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  /**
   * 移除事件监听器
   */
  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      // 移除所有监听器
      this.events.delete(event)
      this.onceEvents.delete(event)
      return
    }

    // 移除普通监听器
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.events.delete(event)
      }
    }

    // 移除一次性监听器
    const onceHandlers = this.onceEvents.get(event)
    if (onceHandlers) {
      onceHandlers.delete(handler)
      if (onceHandlers.size === 0) {
        this.onceEvents.delete(event)
      }
    }
  }

  /**
   * 添加一次性事件监听器
   */
  once(event: string, handler: EventHandler): UnsubscribeFn {
    if (typeof handler !== 'function') {
      throw new TypeError('Event handler must be a function')
    }

    let onceHandlers = this.onceEvents.get(event)
    if (!onceHandlers) {
      onceHandlers = new Set()
      this.onceEvents.set(event, onceHandlers)
    }

    onceHandlers.add(handler)

    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
      this.onceEvents.delete(event)
    } else {
      this.events.clear()
      this.onceEvents.clear()
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: string): number {
    const handlers = this.events.get(event)
    const onceHandlers = this.onceEvents.get(event)
    return (handlers?.size || 0) + (onceHandlers?.size || 0)
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): string[] {
    const names = new Set<string>()
    for (const event of this.events.keys()) {
      names.add(event)
    }
    for (const event of this.onceEvents.keys()) {
      names.add(event)
    }
    return Array.from(names)
  }

  /**
   * 设置最大监听器数量
   */
  setMaxListeners(n: number): void {
    if (typeof n !== 'number' || n < 0 || Number.isNaN(n)) {
      throw new TypeError('n must be a non-negative number')
    }
    this.maxListeners = n
  }

  /**
   * 获取最大监听器数量
   */
  getMaxListeners(): number {
    return this.maxListeners
  }

  /**
   * 检查是否有监听器
   */
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0
  }

  /**
   * 获取事件监听器列表
   */
  listeners(event: string): EventHandler[] {
    const handlers = this.events.get(event)
    const onceHandlers = this.onceEvents.get(event)
    const result: EventHandler[] = []
    
    if (handlers) {
      result.push(...handlers)
    }
    if (onceHandlers) {
      result.push(...onceHandlers)
    }
    
    return result
  }

  /**
   * 销毁事件发射器
   */
  destroy(): void {
    this.removeAllListeners()
  }
}