/**
 * Vue 3 组合式 API
 */

import { inject, onMounted, onUnmounted } from 'vue'
import type { CoreEngine, Plugin } from '@ldesign/engine-core'

/**
 * 使用引擎
 * 
 * @returns 引擎实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useEngine } from '@ldesign/engine-vue3'
 * 
 * const engine = useEngine()
 * 
 * // 使用引擎功能
 * engine.state.set('count', 0)
 * engine.events.emit('custom-event', { data: 'hello' })
 * </script>
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = inject<CoreEngine>('engine')
  if (!engine) {
    throw new Error('Engine not found. Make sure you have called createEngineApp.')
  }
  return engine
}

/**
 * 使用插件
 * 
 * @param name - 插件名称
 * @returns 插件实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { usePlugin } from '@ldesign/engine-vue3'
 * 
 * const i18nPlugin = usePlugin('i18n')
 * const currentLocale = i18nPlugin.getLocale()
 * </script>
 * ```
 */
export function usePlugin(name: string): Plugin | undefined {
  const engine = useEngine()
  return engine.plugins.get(name)
}

/**
 * 使用状态
 * 
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 状态值
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useState } from '@ldesign/engine-vue3'
 * 
 * const count = useState('count', 0)
 * </script>
 * ```
 */
export function useState<T>(key: string, defaultValue?: T): T {
  const engine = useEngine()
  const value = engine.state.get(key)
  return value !== undefined ? value : defaultValue
}

/**
 * 使用事件
 * 
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useEvent } from '@ldesign/engine-vue3'
 * 
 * useEvent('custom-event', (payload) => {
 *   console.log('Event received:', payload)
 * })
 * </script>
 * ```
 */
export function useEvent(event: string, handler: (payload: any) => void): void {
  const engine = useEngine()

  onMounted(() => {
    engine.events.on(event, handler)
  })

  onUnmounted(() => {
    engine.events.off(event, handler)
  })
}

/**
 * 使用生命周期
 * 
 * @param hook - 生命周期钩子名称
 * @param handler - 处理函数
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useLifecycle } from '@ldesign/engine-vue3'
 * 
 * useLifecycle('mounted', () => {
 *   console.log('Component mounted')
 * })
 * </script>
 * ```
 */
export function useLifecycle(
  hook: string,
  handler: () => void | Promise<void>
): void {
  const engine = useEngine()

  onMounted(() => {
    engine.lifecycle.on(hook, handler)
  })

  onUnmounted(() => {
    engine.lifecycle.off(hook, handler)
  })
}

