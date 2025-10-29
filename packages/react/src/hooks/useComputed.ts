/**
 * React Hook - useComputed
 */

import { useState, useEffect } from 'react'
import { useEngine } from './useEngine'

/**
 * 使用引擎计算属性
 * 
 * 创建一个基于引擎状态的计算属性,当依赖的状态变化时自动重新计算
 *
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径数组
 * @returns 计算后的值
 *
 * @example
 * ```tsx
 * function Cart() {
 *   const [items] = useEngineState('cart.items', [])
 *   
 *   const total = useEngineComputed(
 *     () => {
 *       return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
 *     },
 *     ['cart.items']
 *   )
 *
 *   return <div>Total: ${total}</div>
 * }
 * ```
 */
export function useEngineComputed<T>(
  getter: () => T,
  deps: string[]
): T {
  const engine = useEngine()
  const [computed, setComputed] = useState<T>(getter)

  useEffect(() => {
    // 监听所有依赖的状态变化
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => {
        setComputed(getter())
      })
    )

    return () => {
      unwatchers.forEach(unwatch => unwatch())
    }
  }, [engine, getter, ...deps])

  return computed
}

/**
 * 使用引擎计算属性 (带初始值)
 * 
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径数组
 * @param initialValue - 初始值
 * @returns 计算后的值
 *
 * @example
 * ```tsx
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
 *   return <div>Items: {itemCount}</div>
 * }
 * ```
 */
export function useEngineComputedWithDefault<T>(
  getter: () => T,
  deps: string[],
  initialValue: T
): T {
  const engine = useEngine()
  const [computed, setComputed] = useState<T>(initialValue)

  // 初始计算
  useEffect(() => {
    try {
      setComputed(getter())
    } catch (error) {
      console.warn('[useEngineComputedWithDefault] 初始计算失败,使用默认值:', error)
    }
  }, [])

  useEffect(() => {
    // 监听所有依赖的状态变化
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => {
        try {
          setComputed(getter())
        } catch (error) {
          console.warn('[useEngineComputedWithDefault] 计算失败,保持当前值:', error)
        }
      })
    )

    return () => {
      unwatchers.forEach(unwatch => unwatch())
    }
  }, [engine, getter, ...deps])

  return computed
}

