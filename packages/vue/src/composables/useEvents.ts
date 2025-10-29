/**
 * Vue3 组合式 API - useEvents
 */

import { onUnmounted } from 'vue'
import type { EventHandler, EventManager, EventOptions } from '@ldesign/engine-core'
import { useEngine } from './useEngine'

/**
 * 使用事件系统
 */
export function useEvents(): EventManager {
  return useEngine().events
}

/**
 * 监听事件（自动清理）
 *
 * @param eventName - 事件名称
 * @param handler - 事件处理器
 * @param options - 事件选项
 *
 * @example
 * ```vue
 * <script setup>
 * useEventListener('user:login', (user) => {
 *   console.log('User logged in:', user)
 * })
 * </script>
 * ```
 */
export function useEventListener<T = any>(
  eventName: string,
  handler: EventHandler<T>,
  options?: EventOptions
): void {
  const events = useEvents()
  const unsubscribe = events.on(eventName, handler, options)

  // 组件卸载时自动清理
  onUnmounted(() => {
    unsubscribe()
  })
}

/**
 * 使用事件发射器
 *
 * @returns 发射事件的函数
 *
 * @example
 * ```vue
 * <script setup>
 * const emit = useEventEmitter()
 *
 * const handleClick = () => {
 *   emit('button:clicked', { timestamp: Date.now() })
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleClick">Click me</button>
 * </template>
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
 * ```vue
 * <script setup>
 * useEngineEvent('user:login', (user) => {
 *   console.log('User logged in:', user)
 * })
 * </script>
 * ```
 */
export const useEngineEvent = useEventListener

