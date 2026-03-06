/**
 * 计算状态组合式 API
 *
 * 基于引擎状态的派生计算，自动追踪依赖变化
 *
 * @module composables/use-computed-state
 */

import { ref, onUnmounted, type Ref } from 'vue'
import { useEngine } from './use-engine'

/**
 * 使用引擎计算状态
 *
 * 基于一个或多个引擎状态键计算派生值，当依赖的状态变化时自动重新计算
 *
 * @param dependencies - 依赖的状态键列表
 * @param compute - 计算函数，接收依赖状态的值
 * @returns 响应式的计算结果
 *
 * @example
 * ```vue
 * <script setup>
 * import { useComputedState } from '@ldesign/engine-vue3'
 *
 * // 基于 users 和 filter 状态计算过滤后的用户列表
 * const filteredUsers = useComputedState(
 *   ['users', 'filter'],
 *   (deps) => {
 *     const users = deps.users as User[] || []
 *     const filter = deps.filter as string || ''
 *     return users.filter(u => u.name.includes(filter))
 *   }
 * )
 * </script>
 *
 * <template>
 *   <ul>
 *     <li v-for="user in filteredUsers" :key="user.id">{{ user.name }}</li>
 *   </ul>
 * </template>
 * ```
 */
export function useComputedState<T>(
  dependencies: string[],
  compute: (deps: Record<string, unknown>) => T
): Ref<T> {
  const engine = useEngine()

  // 收集当前依赖值并计算初始值
  const getDeps = (): Record<string, unknown> => {
    const deps: Record<string, unknown> = {}
    for (const key of dependencies) {
      deps[key] = engine.state.get(key)
    }
    return deps
  }

  const result = ref<T>(compute(getDeps())) as Ref<T>

  // 监听所有依赖状态的变化
  const unwatchers: Array<() => void> = []

  for (const key of dependencies) {
    const unwatch = engine.state.watch(key, () => {
      // 依赖变化时重新计算
      result.value = compute(getDeps())
    })
    unwatchers.push(unwatch)
  }

  // 组件卸载时取消所有监听
  onUnmounted(() => {
    for (const unwatch of unwatchers) {
      unwatch()
    }
  })

  return result
}

/**
 * 使用引擎状态选择器
 *
 * 从引擎状态中选择和转换单个值
 *
 * @param key - 状态键
 * @param selector - 选择器函数
 * @param defaultValue - 默认值
 * @returns 响应式的选择结果
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStateSelector } from '@ldesign/engine-vue3'
 *
 * // 从用户状态中选择用户名
 * const userName = useStateSelector('user', (user) => user?.name, '匿名')
 *
 * // 从列表状态中选择数量
 * const itemCount = useStateSelector('items', (items) => items?.length ?? 0, 0)
 * </script>
 * ```
 */
export function useStateSelector<T, R>(
  key: string,
  selector: (value: T | undefined) => R,
  defaultValue?: R
): Ref<R> {
  const engine = useEngine()

  const currentValue = engine.state.get<T>(key)
  const result = ref<R>(
    currentValue !== undefined ? selector(currentValue) : (defaultValue as R)
  ) as Ref<R>

  const unwatch = engine.state.watch<T>(key, (newValue) => {
    result.value = selector(newValue as T)
  })

  onUnmounted(() => {
    unwatch()
  })

  return result
}
