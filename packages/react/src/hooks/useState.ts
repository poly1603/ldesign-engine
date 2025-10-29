/**
 * React Hook - useState
 *
 * 改进版本:使用响应式状态桥接器实现深度集成
 */

import { useEffect, useState as useReactState, useMemo, useCallback } from 'react'
import type { StateManager } from '@ldesign/engine-core'
import { createReactiveStateBridge } from '@ldesign/engine-core'
import { useEngine } from './useEngine'
import { createReactStateAdapter } from '../adapter'

/**
 * 使用状态管理器
 */
export function useState(): StateManager {
  return useEngine().state
}

/**
 * 使用引擎状态（响应式 - 改进版）
 *
 * 使用响应式状态桥接器实现双向绑定,性能更好,使用更简单
 *
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns [当前值, 更新函数]
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useEngineState('counter', 0)
 *
 *   return (
 *     <button onClick={() => setCount(count + 1)}>
 *       Count: {count}
 *     </button>
 *   )
 * }
 * ```
 */
export function useEngineState<T = any>(
  path: string,
  defaultValue?: T
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void] {
  const engine = useEngine()

  // 创建响应式状态桥接器(只创建一次)
  const bridge = useMemo(
    () => createReactiveStateBridge(
      engine.state,
      createReactStateAdapter(),
      { debug: false }
    ),
    [engine]
  )

  // 创建双向绑定的响应式状态(只创建一次)
  const reactiveState = useMemo(
    () => bridge.createBoundState(path, defaultValue),
    [bridge, path, defaultValue]
  )

  // 使用 React 的 useState 实现响应式
  const [value, setValue] = useReactState<T | undefined>(reactiveState.value)

  // 监听响应式状态变化
  useEffect(() => {
    const unwatch = engine.state.watch<T>(path, (newValue) => {
      setValue(newValue)
    })

    return () => {
      unwatch()
      // 组件卸载时解除绑定
      bridge.unbind(path)
    }
  }, [engine, path, bridge])

  // 更新状态的函数(支持函数式更新)
  const updateValue = useCallback((newValue: T | ((prev: T | undefined) => T)) => {
    const finalValue = typeof newValue === 'function'
      ? (newValue as (prev: T | undefined) => T)(value)
      : newValue

    reactiveState.value = finalValue
    setValue(finalValue)
  }, [reactiveState, value])

  return [value, updateValue]
}

/**
 * 使用引擎状态(简化版 - 只读)
 *
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns 当前值
 *
 * @example
 * ```tsx
 * function UserName() {
 *   const name = useEngineStateValue('user.name', 'Guest')
 *   return <div>Hello, {name}!</div>
 * }
 * ```
 */
export function useEngineStateValue<T = any>(
  path: string,
  defaultValue?: T
): T | undefined {
  const [value] = useEngineState<T>(path, defaultValue)
  return value
}

