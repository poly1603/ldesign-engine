/**
 * Solid Engine State Hooks
 * 
 * 提供与 React/Vue 一致的状态管理 API
 * 
 * @module hooks/useState
 */

import { createSignal, createMemo, onCleanup, type Accessor, type Setter } from 'solid-js'
import type { CoreEngine } from '@ldesign/engine-core'
import { createReactiveStateBridge } from '@ldesign/engine-core'
import { createSolidStateAdapter } from '../adapter'
import { useEngine } from './useEngine'

/**
 * 使用引擎状态
 * 
 * 与 React/Vue 的 useEngineState() 完全一致
 * 返回 [Accessor, Setter] 元组
 * 
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns [Accessor, Setter] 元组
 * 
 * @example
 * ```tsx
 * import { useEngineState } from '@ldesign/engine-solid'
 * 
 * function Counter() {
 *   const [count, setCount] = useEngineState('count', 0)
 * 
 *   return (
 *     <button onClick={() => setCount(prev => prev + 1)}>
 *       Count: {count()}
 *     </button>
 *   )
 * }
 * ```
 */
export function useEngineState<T = any>(
  path: string,
  defaultValue?: T
): [Accessor<T | undefined>, (value: T | ((prev: T | undefined) => T)) => void] {
  const engine = useEngine()

  // 创建响应式状态桥接器
  const bridge = createReactiveStateBridge(
    engine.state,
    createSolidStateAdapter(),
    { debug: false }
  )

  // 创建双向绑定的响应式状态
  const reactiveState = bridge.createBoundState(path, defaultValue)

  // 创建 Solid Signal
  const [value, setValue] = createSignal<T | undefined>(reactiveState.value)

  // 监听引擎状态变化 -> 更新 Signal
  const unwatchEngine = engine.state.watch<T>(path, (newValue) => {
    setValue(() => newValue)
  })

  // 监听 Signal 变化 -> 更新引擎状态
  let isUpdating = false
  const unwatchSignal = createMemo(() => {
    const currentValue = value()
    
    if (!isUpdating) {
      if (currentValue !== undefined) {
        reactiveState.value = currentValue
      } else {
        engine.state.delete(path)
      }
    }
  })

  // 组件销毁时清理
  onCleanup(() => {
    unwatchEngine()
    bridge.unbind(path)
  })

  // 更新函数(支持函数式更新)
  const updateValue = (newValue: T | ((prev: T | undefined) => T)) => {
    isUpdating = true
    
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T | undefined) => T
      const finalValue = updater(value())
      setValue(() => finalValue)
      reactiveState.value = finalValue
    } else {
      setValue(() => newValue)
      reactiveState.value = newValue
    }
    
    isUpdating = false
  }

  return [value, updateValue]
}

/**
 * 使用引擎状态(只读)
 * 
 * 与 React/Vue 的 useEngineStateValue() 完全一致
 * 
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns Accessor(只读)
 * 
 * @example
 * ```tsx
 * import { useEngineStateValue } from '@ldesign/engine-solid'
 * 
 * function UserGreeting() {
 *   const userName = useEngineStateValue('user.name', 'Guest')
 * 
 *   return <div>Hello, {userName()}!</div>
 * }
 * ```
 */
export function useEngineStateValue<T = any>(
  path: string,
  defaultValue?: T
): Accessor<T | undefined> {
  const engine = useEngine()

  // 创建 Signal
  const [value, setValue] = createSignal<T | undefined>(
    engine.state.get(path) ?? defaultValue
  )

  // 监听引擎状态变化
  const unwatch = engine.state.watch<T>(path, (newValue) => {
    setValue(() => newValue)
  })

  // 组件销毁时清理
  onCleanup(() => {
    unwatch()
  })

  // 返回只读 Accessor
  return createMemo(() => value())
}

