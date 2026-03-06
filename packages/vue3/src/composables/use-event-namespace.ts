/**
 * 事件命名空间组合式 API
 *
 * 提供命名空间隔离的事件操作，自动清理
 *
 * @module composables/use-event-namespace
 */

import { onUnmounted } from 'vue'
import { EventNamespace } from '@ldesign/engine-core'
import { useEngine } from './use-engine'

/**
 * 命名空间事件返回值
 */
export interface EventNamespaceReturn {
  /** 触发事件 */
  emit: <T = unknown>(event: string, payload?: T) => void
  /** 监听事件 */
  on: <T = unknown>(event: string, handler: (payload?: T) => void) => () => void
  /** 一次性监听 */
  once: <T = unknown>(event: string, handler: (payload?: T) => void) => () => void
  /** 移除监听 */
  off: (event: string, handler?: (...args: any[]) => void) => void
  /** 获取完整路径 */
  getFullPath: () => string
}

/**
 * 使用事件命名空间
 *
 * 创建命名空间隔离的事件操作，组件卸载时自动清理所有监听
 *
 * @param name - 命名空间名称
 * @param separator - 分隔符（默认 ':'）
 * @returns 命名空间化的事件操作
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEventNamespace } from '@ldesign/engine-vue3'
 *
 * const userEvents = useEventNamespace('user')
 *
 * // 实际监听 'user:login' 事件
 * userEvents.on('login', (data) => {
 *   console.log('User logged in:', data)
 * })
 *
 * // 实际触发 'user:logout' 事件
 * userEvents.emit('logout', { reason: 'manual' })
 * </script>
 * ```
 */
export function useEventNamespace(
  name: string,
  separator = ':'
): EventNamespaceReturn {
  const engine = useEngine()
  const ns = new EventNamespace(engine.events, { name, separator })

  // 收集所有监听器以便在卸载时清理
  const cleanups: Array<() => void> = []

  const on = <T = unknown>(event: string, handler: (payload?: T) => void) => {
    const unsub = ns.on(event, handler)
    cleanups.push(unsub)
    return unsub
  }

  const once = <T = unknown>(event: string, handler: (payload?: T) => void) => {
    const unsub = ns.once(event, handler)
    cleanups.push(unsub)
    return unsub
  }

  onUnmounted(() => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  })

  return {
    emit: <T = unknown>(event: string, payload?: T) => ns.emit(event, payload),
    on,
    once,
    off: (event: string, handler?: (...args: any[]) => void) => ns.off(event, handler),
    getFullPath: () => ns.getFullPath(),
  }
}
