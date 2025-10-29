/**
 * Angular 引擎事件服务
 */

import { Injectable, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { EngineService } from './engine.service'
import type { EventHandler, EventOptions } from '@ldesign/engine-core'

/**
 * 引擎事件服务
 * 
 * 提供事件系统功能
 */
@Injectable({ providedIn: 'root' })
export class EngineEventsService implements OnDestroy {
  private subscriptions: Subscription[] = []

  constructor(private engine: EngineService) { }

  /**
   * 监听事件
   * 
   * @param eventName - 事件名称
   * @param handler - 事件处理器
   * @param options - 事件选项
   * @returns Subscription
   */
  listen<T = any>(
    eventName: string,
    handler: EventHandler<T>,
    options?: EventOptions
  ): Subscription {
    const unsubscribe = this.engine.events.on(eventName, handler, options)

    const subscription = new Subscription(() => {
      unsubscribe()
    })

    this.subscriptions.push(subscription)

    return subscription
  }

  /**
   * 发射事件
   * 
   * @param eventName - 事件名称
   * @param payload - 事件负载
   */
  emit(eventName: string, payload?: any): void {
    this.engine.events.emit(eventName, payload)
  }

  /**
   * 监听一次事件
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): Subscription {
    return this.listen(eventName, handler, { once: true })
  }

  /**
   * 移除事件监听器
   */
  off(eventName: string): void {
    this.engine.events.off(eventName)
  }

  /**
   * 清理所有订阅
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe())
    this.subscriptions = []
  }
}


