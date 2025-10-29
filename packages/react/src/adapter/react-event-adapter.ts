/**
 * React 事件适配器实现
 * 
 * 提供 React 特定的事件系统集成
 * 
 * @module adapter/react-event-adapter
 */

import type { EventAdapter, EventHandler, Unsubscribe } from '@ldesign/engine-core'

/**
 * React 事件适配器
 * 
 * 实现 EventAdapter 接口,提供简单的事件发布订阅功能
 */
export class ReactEventAdapter implements EventAdapter {
  private events = new Map<string, Set<EventHandler>>()

  /**
   * 发射事件
   * 
   * @param event - 事件名称
   * @param payload - 事件数据
   */
  emit(event: string, payload?: any): void {
    const handlers = this.events.get(event)
    if (!handlers || handlers.size === 0) {
      return
    }

    // 使用 queueMicrotask 异步执行,避免阻塞
    queueMicrotask(() => {
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`[ReactEventAdapter] Error in event handler for "${event}":`, error)
        }
      })
    })
  }

  /**
   * 监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   */
  on(event: string, handler: EventHandler): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    this.events.get(event)!.add(handler)

    return () => {
      this.off(event, handler)
    }
  }

  /**
   * 一次性监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   */
  once(event: string, handler: EventHandler): Unsubscribe {
    const wrappedHandler: EventHandler = (payload) => {
      handler(payload)
      this.off(event, wrappedHandler)
    }

    return this.on(event, wrappedHandler)
  }

  /**
   * 取消监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理器(可选)
   */
  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      // 移除所有监听器
      this.events.delete(event)
      return
    }

    const handlers = this.events.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.events.delete(event)
      }
    }
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.events.clear()
  }

  /**
   * 获取事件监听器数量
   * 
   * @param event - 事件名称(可选)
   * @returns 监听器数量
   */
  listenerCount(event?: string): number {
    if (event) {
      return this.events.get(event)?.size ?? 0
    }

    let total = 0
    this.events.forEach(handlers => {
      total += handlers.size
    })
    return total
  }
}

/**
 * 创建 React 事件适配器
 * 
 * @returns React 事件适配器实例
 */
export function createReactEventAdapter(): ReactEventAdapter {
  return new ReactEventAdapter()
}

