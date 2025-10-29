/**
 * Solid Engine Computed Hooks
 * 
 * 提供与 React/Vue 一致的计算属性 API
 * 
 * @module hooks/useComputed
 */

import { createSignal, createEffect, onCleanup, type Accessor } from 'solid-js'
import { useEngine } from './useEngine'

/**
 * 使用引擎计算属性
 * 
 * 创建一个基于引擎状态的计算属性,当依赖的状态变化时自动重新计算
 * 
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径数组
 * @returns 计算后的 Signal
 * 
 * @example
 * ```tsx
 * import { useEngineState, useEngineComputed } from '@ldesign/engine-solid'
 * 
 * function Cart() {
 *   const [items] = useEngineState('cart.items', [])
 *   
 *   const total = useEngineComputed(
 *     () => {
 *       const cartItems = items() || []
 *       return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
 *     },
 *     ['cart.items']
 *   )
 * 
 *   return <div>Total: ${total()}</div>
 * }
 * ```
 */
export function useEngineComputed<T>(
  getter: () => T,
  deps: string[]
): Accessor<T> {
  const engine = useEngine()
  const [computed, setComputed] = createSignal<T>(getter())

  createEffect(() => {
    // 监听所有依赖的状态变化
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => {
        setComputed(() => getter())
      })
    )

    onCleanup(() => {
      unwatchers.forEach(unwatch => unwatch())
    })
  })

  return computed
}

/**
 * 使用引擎计算属性 (带初始值)
 * 
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径数组
 * @param initialValue - 初始值
 * @returns 计算后的 Signal
 * 
 * @example
 * ```tsx
 * import { useEngineComputedWithDefault } from '@ldesign/engine-solid'
 * 
 * function ItemCount() {
 *   const itemCount = useEngineComputedWithDefault(
 *     () => {
 *       const items = engine.state.get('cart.items') || []
 *       return items.length
 *     },
 *     ['cart.items'],
 *     0
 *   )
 * 
 *   return <div>Items: {itemCount()}</div>
 * }
 * ```
 */
export function useEngineComputedWithDefault<T>(
  getter: () => T,
  deps: string[],
  initialValue: T
): Accessor<T> {
  const engine = useEngine()
  const [computed, setComputed] = createSignal<T>(initialValue)

  // 初始计算
  createEffect(() => {
    try {
      setComputed(() => getter())
    } catch (error) {
      console.warn('[useEngineComputedWithDefault] 初始计算失败,使用默认值:', error)
    }
  })

  createEffect(() => {
    // 监听所有依赖的状态变化
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => {
        try {
          setComputed(() => getter())
        } catch (error) {
          console.warn('[useEngineComputedWithDefault] 计算失败,保持当前值:', error)
        }
      })
    )

    onCleanup(() => {
      unwatchers.forEach(unwatch => unwatch())
    })
  })

  return computed
}

