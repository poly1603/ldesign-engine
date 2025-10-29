/**
 * Svelte Computed Stores
 * 
 * 提供与 React/Vue 一致的计算属性 API
 * 
 * @module stores/computed-store
 */

import { writable, type Writable } from 'svelte/store'
import { onDestroy } from 'svelte'
import { useEngine } from './engine-store'

/**
 * 使用引擎计算属性
 * 
 * 创建一个基于引擎状态的计算属性,当依赖的状态变化时自动重新计算
 * 
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径数组
 * @returns 计算后的 Writable Store
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEngineState, useEngineComputed } from '@ldesign/engine-svelte'
 * 
 * const items = useEngineState('cart.items', [])
 * 
 * const total = useEngineComputed(
 *   () => {
 *     const cartItems = $items || []
 *     return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
 *   },
 *   ['cart.items']
 * )
 * </script>
 * 
 * <div>Total: ${$total}</div>
 * ```
 */
export function useEngineComputed<T>(
  getter: () => T,
  deps: string[]
): Writable<T> {
  const engine = useEngine()
  const computed = writable<T>(getter())

  // 监听所有依赖的状态变化
  const unwatchers = deps.map(dep =>
    engine.state.watch(dep, () => {
      computed.set(getter())
    })
  )

  // 组件销毁时清理
  onDestroy(() => {
    unwatchers.forEach(unwatch => unwatch())
  })

  return computed
}

/**
 * 使用引擎计算属性 (带初始值)
 * 
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径数组
 * @param initialValue - 初始值
 * @returns 计算后的 Writable Store
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEngineComputedWithDefault } from '@ldesign/engine-svelte'
 * 
 * const itemCount = useEngineComputedWithDefault(
 *   () => {
 *     const items = engine.state.get('cart.items') || []
 *     return items.length
 *   },
 *   ['cart.items'],
 *   0
 * )
 * </script>
 * 
 * <div>Items: {$itemCount}</div>
 * ```
 */
export function useEngineComputedWithDefault<T>(
  getter: () => T,
  deps: string[],
  initialValue: T
): Writable<T> {
  const engine = useEngine()
  const computed = writable<T>(initialValue)

  // 初始计算
  try {
    computed.set(getter())
  } catch (error) {
    console.warn('[useEngineComputedWithDefault] 初始计算失败,使用默认值:', error)
  }

  // 监听所有依赖的状态变化
  const unwatchers = deps.map(dep =>
    engine.state.watch(dep, () => {
      try {
        computed.set(getter())
      } catch (error) {
        console.warn('[useEngineComputedWithDefault] 计算失败,保持当前值:', error)
      }
    })
  )

  // 组件销毁时清理
  onDestroy(() => {
    unwatchers.forEach(unwatch => unwatch())
  })

  return computed
}

