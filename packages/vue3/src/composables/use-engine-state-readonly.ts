/**
 * 只读引擎状态组合式 API
 * 
 * 提供只读的状态监听功能，类似于 shared-state 的 useGlobalState
 * 
 * @module composables/use-engine-state-readonly
 */

import { ref, shallowRef, onUnmounted, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useEngine } from './use-engine'

/**
 * 使用引擎状态（只读）
 * 
 * 自动订阅状态变化，组件卸载时自动取消订阅
 * 
 * @param key - 状态键
 * @param shallow - 是否使用浅层响应式（默认 true，性能更好）
 * @returns 响应式状态引用
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useEngineStateReadonly } from '@ldesign/engine-vue3'
 * import type { I18nLocaleState } from '@ldesign/engine-plugin-i18n-bridge'
 * 
 * const locale = useEngineStateReadonly<I18nLocaleState>('i18n.locale')
 * 
 * // locale.value 会自动更新
 * </script>
 * 
 * <template>
 *   <div>当前语言: {{ locale?.locale }}</div>
 * </template>
 * ```
 */
export function useEngineStateReadonly<T = any>(
  key: string,
  shallow = true
): Ref<T | undefined> {
  const engine = useEngine()
  
  // 使用 shallowRef 或 ref
  const state = shallow
    ? shallowRef<T | undefined>(engine.state.get(key))
    : ref<T | undefined>(engine.state.get(key))
  
  // 监听状态变化
  const unwatch = engine.state.watch(key, (newValue) => {
    state.value = newValue
  })
  
  // 组件卸载时取消监听
  onUnmounted(() => {
    unwatch()
  })
  
  return state
}

/**
 * 使用引擎状态（计算属性版本）
 * 
 * 返回计算属性，可以直接在模板中使用
 * 
 * @param key - 状态键
 * @returns 计算属性
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useEngineStateComputed } from '@ldesign/engine-vue3'
 * 
 * const locale = useEngineStateComputed<I18nLocaleState>('i18n.locale')
 * </script>
 * 
 * <template>
 *   <div>当前语言: {{ locale?.locale }}</div>
 * </template>
 * ```
 */
export function useEngineStateComputed<T = any>(
  key: string
): ComputedRef<T | undefined> {
  const state = useEngineStateReadonly<T>(key, true)
  return computed(() => state.value)
}

/**
 * 使用引擎事件（一次性）
 * 
 * 事件触发一次后自动取消订阅
 * 
 * @param event - 事件名称
 * @param handler - 事件处理器
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useEngineEventOnce } from '@ldesign/engine-vue3'
 * 
 * useEngineEventOnce('app:ready', () => {
 *   console.log('App is ready - this will only run once')
 * })
 * </script>
 * ```
 */
export function useEngineEventOnce<T = any>(
  event: string,
  handler: (payload?: T) => void
): void {
  const engine = useEngine()
  
  const unsubscribe = engine.events.once(event, handler)
  
  onUnmounted(() => {
    unsubscribe()
  })
}

