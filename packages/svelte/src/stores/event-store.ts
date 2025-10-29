/**
 * Svelte Event Stores
 * 
 * 提供与 React/Vue 一致的事件系统 API
 * 
 * @module stores/event-store
 */

import { onDestroy } from 'svelte'
import type { EventHandler, EventManager, EventOptions } from '@ldesign/engine-core'
import { useEngine } from './engine-store'

/**
 * 获取事件管理器
 * 
 * 与 React/Vue 的 useEvents() 一致
 * 
 * @returns 事件管理器
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEvents } from '@ldesign/engine-svelte'
 * 
 * const events = useEvents()
 * events.emit('custom:event', { data: 'hello' })
 * </script>
 * ```
 */
export function useEvents(): EventManager {
  return useEngine().events
}

/**
 * 监听事件(自动清理)
 * 
 * 与 React/Vue 的 useEventListener() 一致
 * 
 * @param eventName - 事件名称
 * @param handler - 事件处理器
 * @param options - 事件选项
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEventListener } from '@ldesign/engine-svelte'
 * 
 * useEventListener('user:login', (user) => {
 *   console.log('User logged in:', user)
 * })
 * </script>
 * 
 * <div>Listening for user login...</div>
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
  onDestroy(() => {
    unsubscribe()
  })
}

/**
 * 使用事件发射器
 * 
 * 与 React/Vue 的 useEventEmitter() 一致
 * 
 * @returns 发射事件的函数
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEventEmitter } from '@ldesign/engine-svelte'
 * 
 * const emit = useEventEmitter()
 * 
 * function handleClick() {
 *   emit('button:clicked', { timestamp: Date.now() })
 * }
 * </script>
 * 
 * <button on:click={handleClick}>Click me</button>
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
 * ```svelte
 * <script>
 * import { useEngineEvent } from '@ldesign/engine-svelte'
 *
 * useEngineEvent('user:login', (user) => {
 *   console.log('User logged in:', user)
 * })
 * </script>
 * ```
 */
export const useEngineEvent = useEventListener

