/**
 * React Hook - useEvents
 */

import { useEffect, useCallback } from 'react'
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
 * ```tsx
 * function MyComponent() {
 *   useEventListener('user:login', (user) => {
 *     console.log('User logged in:', user)
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useEventListener<T = any>(
  eventName: string,
  handler: EventHandler<T>,
  options?: EventOptions
): void {
  const events = useEvents()

  useEffect(() => {
    const unsubscribe = events.on(eventName, handler, options)

    return () => {
      unsubscribe()
    }
  }, [events, eventName, handler, options])
}

/**
 * 使用事件发射器
 *
 * @returns 发射事件的函数
 *
 * @example
 * ```tsx
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

  return useCallback((eventName: string, payload?: any) => {
    events.emit(eventName, payload)
  }, [events])
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

