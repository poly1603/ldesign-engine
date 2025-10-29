/**
 * Vue3 组合式 API - useState
 *
 * 改进版本:使用响应式状态桥接器实现深度集成
 */

import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import type { StateManager } from '@ldesign/engine-core'
import { createReactiveStateBridge } from '@ldesign/engine-core'
import { useEngine } from './useEngine'
import { createVue3StateAdapter } from '../adapter'

/**
 * 使用状态管理器
 */
export function useState(): StateManager {
  return useEngine().state
}

/**
 * 使用引擎状态（改进版 - 完全一致的 API）
 *
 * 使用响应式状态桥接器实现引擎状态和 Vue 响应式系统的深度集成
 *
 * ⚠️ 注意:为了与 React 保持 API 一致,返回元组 [Ref, Setter]
 *
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns [Ref 对象, 更新函数]
 *
 * @example
 * ```vue
 * <script setup>
 * const [count, setCount] = useEngineState('counter', 0)
 *
 * function increment() {
 *   setCount(prev => prev + 1)
 * }
 * </script>
 *
 * <template>
 *   <button @click="increment">Count: {{ count }}</button>
 * </template>
 * ```
 */
export function useEngineState<T = any>(
  path: string,
  defaultValue?: T
): [Ref<T | undefined>, (value: T | ((prev: T | undefined) => T)) => void] {
  const engine = useEngine()

  // 创建响应式状态桥接器
  const bridge = createReactiveStateBridge(
    engine.state,
    createVue3StateAdapter(),
    { debug: false }
  )

  // 创建双向绑定的响应式状态
  const reactiveState = bridge.createBoundState(path, defaultValue)

  // 创建 Vue Ref
  const value = ref<T | undefined>(reactiveState.value)

  // 监听引擎状态变化 -> 更新 Vue Ref
  const unwatchEngine = engine.state.watch<T>(path, (newValue) => {
    value.value = newValue
  })

  // 监听 Vue Ref 变化 -> 更新引擎状态
  const stopWatch = watch(value, (newValue) => {
    if (newValue !== undefined) {
      reactiveState.value = newValue
    } else {
      engine.state.delete(path)
    }
  })

  // 组件卸载时清理
  onUnmounted(() => {
    unwatchEngine()
    stopWatch()
    bridge.unbind(path)
  })

  // 更新函数(支持函数式更新)
  const updateValue = (newValue: T | ((prev: T | undefined) => T)) => {
    value.value = typeof newValue === 'function'
      ? (newValue as (prev: T | undefined) => T)(value.value)
      : newValue
  }

  return [value, updateValue]
}

/**
 * 使用响应式状态（兼容旧版 API）
 *
 * @deprecated 请使用 useEngineState 以保持与其他框架的一致性
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns Vue Ref 对象
 */
export function useReactiveState<T = any>(
  path: string,
  defaultValue?: T
): Ref<T | undefined> {
  const [value] = useEngineState<T>(path, defaultValue)
  return value
}

/**
 * 使用引擎状态(只读)
 *
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns 只读的 ComputedRef
 *
 * @example
 * ```vue
 * <script setup>
 * const userName = useEngineStateValue('user.name', 'Guest')
 * </script>
 *
 * <template>
 *   <div>Hello, {{ userName }}!</div>
 * </template>
 * ```
 */
export function useEngineStateValue<T = any>(
  path: string,
  defaultValue?: T
): ComputedRef<T | undefined> {
  const engine = useEngine()
  const value = ref<T | undefined>(engine.state.get(path) ?? defaultValue)

  // 监听状态变化
  const unwatch = engine.state.watch<T>(path, (newValue) => {
    value.value = newValue
  })

  // 组件卸载时清理
  onUnmounted(() => {
    unwatch()
  })

  // 返回只读的 computed
  return computed(() => value.value)
}

