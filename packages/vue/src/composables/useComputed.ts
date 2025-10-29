/**
 * Vue3 组合式 API - useComputed
 */

import { ref, onUnmounted, type Ref } from 'vue'
import { useEngine } from './useEngine'

/**
 * 使用引擎计算属性
 * 
 * 创建一个基于引擎状态的计算属性,当依赖的状态变化时自动重新计算
 *
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径数组
 * @returns 计算后的响应式值
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEngineState, useEngineComputed } from '@ldesign/engine-vue'
 * 
 * const [items] = useEngineState('cart.items', [])
 * 
 * const total = useEngineComputed(
 *   () => {
 *     const cartItems = items.value || []
 *     return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
 *   },
 *   ['cart.items']
 * )
 * </script>
 *
 * <template>
 *   <div>
 *     <p>Total: ${{ total }}</p>
 *   </div>
 * </template>
 * ```
 */
export function useEngineComputed<T>(
  getter: () => T,
  deps: string[]
): Ref<T> {
  const engine = useEngine()
  const computed = ref<T>(getter()) as Ref<T>

  // 监听所有依赖的状态变化
  const unwatchers = deps.map(dep =>
    engine.state.watch(dep, () => {
      computed.value = getter()
    })
  )

  // 组件卸载时清理
  onUnmounted(() => {
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
 * @returns 计算后的响应式值
 *
 * @example
 * ```vue
 * <script setup>
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
 * <template>
 *   <div>Items: {{ itemCount }}</div>
 * </template>
 * ```
 */
export function useEngineComputedWithDefault<T>(
  getter: () => T,
  deps: string[],
  initialValue: T
): Ref<T> {
  const engine = useEngine()
  const computed = ref<T>(initialValue) as Ref<T>

  // 初始计算
  try {
    computed.value = getter()
  } catch (error) {
    console.warn('[useEngineComputedWithDefault] 初始计算失败,使用默认值:', error)
  }

  // 监听所有依赖的状态变化
  const unwatchers = deps.map(dep =>
    engine.state.watch(dep, () => {
      try {
        computed.value = getter()
      } catch (error) {
        console.warn('[useEngineComputedWithDefault] 计算失败,保持当前值:', error)
      }
    })
  )

  // 组件卸载时清理
  onUnmounted(() => {
    unwatchers.forEach(unwatch => unwatch())
  })

  return computed
}

