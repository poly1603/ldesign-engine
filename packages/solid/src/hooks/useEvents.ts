/**
 * Solid Engine Event Hooks
 * 
 * 提供与 React/Vue 一致的事件系统 API
 * 
 * @module hooks/useEvents
 */

import { onCleanup } from 'solid-js'
import type { EventHandler, EventManager, EventOptions } from '@ldesign/engine-core'
import { useEngine } from './useEngine'

/**
 * 获取事件管理器
 * 
 * 与 React/Vue 的 useEvents() 完全一致
 * 
 * @returns 事件管理器
 * 
 * @example
 * ```tsx
 * import { useEvents } from '@ldesign/engine-solid'
 * 
 * function MyComponent() {
 *   const events = useEvents()
 *   events.emit('custom:event', { data: 'hello' })
 * 
 *   return <div>Events ready</div>
 * }
 * ```
 */
export function useEvents(): EventManager {
  return useEngine().events
}

/**
 * 监听事件(自动清理)
 * 
 * 与 React/Vue 的 useEventListener() 完全一致
 * 
 * @param eventName - 事件名称
 * @param handler - 事件处理器
 * @param options - 事件选项
 * 
 * @example
 * ```tsx
 * import { useEventListener } from '@ldesign/engine-solid'
 * 
 * function MyComponent() {
 *   useEventListener('user:login', (user) => {
 *     console.log('User logged in:', user)
 *   })
 * 
 *   return <div>Listening for user login...</div>
 * }
 * ```
 */
export function useEventListener<T = any>(
  eventName: string,
  handler: EventHandler<T>,
  options?: EventOptions
): void {
  const events = useEvents()
  const unsubscribe = events.on(eventName, handler, options)

  // 组件销毁时自动清理
  onCleanup(() => {
    unsubscribe()
  })
}

/**
 * 使用事件发射器
 * 
 * 与 React/Vue 的 useEventEmitter() 完全一致
 * 
 * @returns 发射事件的函数
 * 
 * @example
 * ```tsx
 * import { useEventEmitter } from '@ldesign/engine-solid'
 * 
 * function MyComponent() {
 *   const emit = useEventEmitter()
 * 
 *   const handleClick = () => {
 *     emit('button:clicked', { timestamp: Date.now() })
 *   }
 * 
 *   return <button onClick={handleClick}>Click me</button>
 * }
 * ```
 */
export function useEventEmitter(): (eventName: string, payload?: any) => void {
  const events = useEvents()

  return (eventName: string, payload?: any) => {
    events.emit(eventName, payload)
  }
}

/**
 * 使用引擎事件 (统一 API)
 *
 * 这是 useEventListener 的别名,用于与其他框架保持 API 一致性
 *
 * @param eventName - 事件名称
 * @param handler - 事件处理器
 * @param options - 事件选项
 *
 * @example
 * ```tsx
 * import { useEngineEvent } from '@ldesign/engine-solid'
 *
 * function MyComponent() {
 *   useEngineEvent('user:login', (user) => {
 *     console.log('User logged in:', user)
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export const useEngineEvent = useEventListener

