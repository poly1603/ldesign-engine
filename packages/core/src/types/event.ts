/**
 * 事件系统类型定义
 */

/**
 * 取消订阅函数
 */
export type Unsubscribe = () => void

/**
 * 事件处理函数
 */
export type EventHandler<T = any> = (payload: T) => void | Promise<void>

/**
 * 事件管理器接口
 */
export interface EventManager {
  /** 触发事件 */
  emit: <T = any>(event: string, payload?: T) => void
  /** 监听事件 */
  on: <T = any>(event: string, handler: EventHandler<T>) => Unsubscribe
  /** 一次性监听 */
  once: <T = any>(event: string, handler: EventHandler<T>) => Unsubscribe
  /** 移除事件监听 */
  off: (event: string, handler?: EventHandler) => void
  /** 清空所有事件 */
  clear: () => void
  /** 获取事件监听器数量 */
  listenerCount: (event: string) => number
}

