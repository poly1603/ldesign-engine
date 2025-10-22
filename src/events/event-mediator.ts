/**
 * 事件中介者（Event Mediator）
 * 提供集中式的事件管理和路由
 */

import type { EventHandler, EventManager } from '../types'

export interface MediatorChannel<T = unknown> {
  name: string
  subscribers: Set<EventHandler<T>>
  middleware: Array<(data: T) => T | Promise<T>>
  filters: Array<(data: T) => boolean>
}

/**
 * 事件中介者 - 实现发布/订阅的集中管理
 */
export class EventMediator {
  private channels = new Map<string, MediatorChannel>()
  private eventManager?: EventManager
  private stats = {
    totalChannels: 0,
    totalSubscribers: 0,
    totalMessages: 0,
    filteredMessages: 0
  }

  constructor(eventManager?: EventManager) {
    this.eventManager = eventManager
  }

  /**
   * 创建或获取频道
   */
  channel<T = unknown>(name: string): MediatorChannel<T> {
    if (!this.channels.has(name)) {
      const channel: MediatorChannel<T> = {
        name,
        subscribers: new Set(),
        middleware: [],
        filters: []
      }
      this.channels.set(name, channel as MediatorChannel)
      this.stats.totalChannels++
    }
    return this.channels.get(name) as MediatorChannel<T>
  }

  /**
   * 订阅频道
   */
  subscribe<T = unknown>(
    channelName: string,
    handler: EventHandler<T>
  ): () => void {
    const channel = this.channel<T>(channelName)
    channel.subscribers.add(handler as EventHandler)
    this.stats.totalSubscribers++

    // 返回取消订阅函数
    return () => {
      channel.subscribers.delete(handler as EventHandler)
      this.stats.totalSubscribers--

      if (channel.subscribers.size === 0 &&
        channel.middleware.length === 0 &&
        channel.filters.length === 0) {
        this.channels.delete(channelName)
        this.stats.totalChannels--
      }
    }
  }

  /**
   * 发布消息到频道
   */
  async publish<T = unknown>(channelName: string, data: T): Promise<void> {
    const channel = this.channels.get(channelName)
    if (!channel) {
      return
    }

    this.stats.totalMessages++

    // 应用过滤器
    for (const filter of channel.filters) {
      if (!filter(data)) {
        this.stats.filteredMessages++
        return
      }
    }

    // 应用中间件处理数据
    let processedData = data
    for (const middleware of channel.middleware) {
      processedData = await middleware(processedData)
    }

    // 通知所有订阅者
    const promises: Promise<void>[] = []
    for (const subscriber of channel.subscribers) {
      promises.push(
        Promise.resolve().then(() => subscriber(processedData))
      )
    }

    await Promise.allSettled(promises)

    // 同时触发底层事件管理器（如果存在）
    if (this.eventManager) {
      this.eventManager.emit(channelName, processedData)
    }
  }

  /**
   * 添加频道中间件
   */
  use<T = unknown>(
    channelName: string,
    middleware: (data: T) => T | Promise<T>
  ): void {
    const channel = this.channel<T>(channelName)
    channel.middleware.push(middleware as any)
  }

  /**
   * 添加频道过滤器
   */
  filter<T = unknown>(
    channelName: string,
    filter: (data: T) => boolean
  ): void {
    const channel = this.channel<T>(channelName)
    channel.filters.push(filter as any)
  }

  /**
   * 桥接两个频道
   */
  bridge(
    sourceChannel: string,
    targetChannel: string,
    transform?: (data: any) => any
  ): () => void {
    return this.subscribe(sourceChannel, async (data) => {
      const transformedData = transform ? transform(data) : data
      await this.publish(targetChannel, transformedData)
    })
  }

  /**
   * 获取统计信息
   */
  getStats(): typeof EventMediator.prototype.stats {
    return { ...this.stats }
  }

  /**
   * 清理所有频道
   */
  clear(): void {
    this.channels.clear()
    this.stats = {
      totalChannels: 0,
      totalSubscribers: 0,
      totalMessages: 0,
      filteredMessages: 0
    }
  }

  /**
   * 销毁中介者
   */
  destroy(): void {
    this.clear()
    this.eventManager = undefined
  }
}

/**
 * 创建事件中介者
 */
export function createEventMediator(eventManager?: EventManager): EventMediator {
  return new EventMediator(eventManager)
}



