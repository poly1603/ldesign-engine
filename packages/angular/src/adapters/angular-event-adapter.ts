/**
 * Angular 事件适配器
 * 
 * 使用 RxJS Subject 实现事件系统
 */

import type { EventAdapter } from '@ldesign/engine-core'
import { Subject } from 'rxjs'

/**
 * 创建 Angular 事件适配器
 */
export function createAngularEventAdapter(): EventAdapter {
  const subjects = new Map<string, Subject<any>>()

  return {
    /**
     * 发射事件
     */
    emit(eventName: string, payload?: any): void {
      const subject = subjects.get(eventName)
      if (subject) {
        subject.next(payload)
      }
    },

    /**
     * 监听事件
     */
    on(eventName: string, handler: (payload: any) => void): () => void {
      let subject = subjects.get(eventName)
      if (!subject) {
        subject = new Subject()
        subjects.set(eventName, subject)
      }

      const subscription = subject.subscribe(handler)

      return () => {
        subscription.unsubscribe()
      }
    },

    /**
     * 移除所有监听器
     */
    off(eventName: string): void {
      const subject = subjects.get(eventName)
      if (subject) {
        subject.complete()
        subjects.delete(eventName)
      }
    }
  }
}


