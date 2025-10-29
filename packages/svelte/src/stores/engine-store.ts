/**
 * Svelte Engine Stores
 * 
 * 提供与 React/Vue 一致的 API,使用 Svelte Store 实现
 * 
 * @module stores/engine-store
 */

import { writable, derived, get, type Writable, type Readable } from 'svelte/store'
import { onDestroy, getContext } from 'svelte'
import type { CoreEngine } from '@ldesign/engine-core'
import { createReactiveStateBridge } from '@ldesign/engine-core'
import { createSvelteStateAdapter } from '../adapter'
import { ENGINE_CONTEXT_KEY } from '../engine-app'

/**
 * 获取引擎实例
 * 
 * 与 React/Vue 的 useEngine() 一致
 * 
 * @returns 引擎实例
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEngine } from '@ldesign/engine-svelte'
 * 
 * const engine = useEngine()
 * console.log('Engine:', engine)
 * </script>
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = getContext<CoreEngine>(ENGINE_CONTEXT_KEY)

  if (!engine) {
    throw new Error('Engine not found. Make sure to set engine context.')
  }

  return engine
}

/**
 * 创建引擎状态 Store
 * 
 * 与 React/Vue 的 useEngineState() 一致,返回 Svelte Writable Store
 * 
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns Writable Store 和更新函数的元组
 * 
 * @example
 * ```svelte
 * <script>
 * import { createEngineStore } from '@ldesign/engine-svelte'
 * 
 * const [count, setCount] = createEngineStore('count', 0)
 * 
 * function increment() {
 *   setCount(prev => prev + 1)
 * }
 * </script>
 * 
 * <button on:click={increment}>
 *   Count: {$count}
 * </button>
 * ```
 */
export function createEngineStore<T>(
  path: string,
  defaultValue?: T
): [Writable<T | undefined>, (value: T | ((prev: T | undefined) => T)) => void] {
  const engine = useEngine()

  // 创建响应式状态桥接器
  const bridge = createReactiveStateBridge(
    engine.state,
    createSvelteStateAdapter(),
    { debug: false }
  )

  // 创建双向绑定的响应式状态
  const reactiveState = bridge.createBoundState(path, defaultValue)

  // 创建 Svelte Writable Store
  const store = writable<T | undefined>(reactiveState.value)

  // 监听引擎状态变化 -> 更新 Store
  const unwatchEngine = engine.state.watch<T>(path, (newValue) => {
    store.set(newValue)
  })

  // 监听 Store 变化 -> 更新引擎状态
  const unsubscribe = store.subscribe((newValue) => {
    if (newValue !== undefined) {
      reactiveState.value = newValue
    } else {
      engine.state.delete(path)
    }
  })

  // 组件销毁时清理
  onDestroy(() => {
    unwatchEngine()
    unsubscribe()
    bridge.unbind(path)
  })

  // 更新函数(支持函数式更新)
  const updateValue = (newValue: T | ((prev: T | undefined) => T)) => {
    if (typeof newValue === 'function') {
      store.update(newValue as (prev: T | undefined) => T)
    } else {
      store.set(newValue)
    }
  }

  return [store, updateValue]
}

/**
 * 创建引擎状态 Store(只读)
 * 
 * 与 React/Vue 的 useEngineStateValue() 一致
 * 
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns Readable Store
 * 
 * @example
 * ```svelte
 * <script>
 * import { createEngineReadable } from '@ldesign/engine-svelte'
 * 
 * const userName = createEngineReadable('user.name', 'Guest')
 * </script>
 * 
 * <div>Hello, {$userName}!</div>
 * ```
 */
export function createEngineReadable<T>(
  path: string,
  defaultValue?: T
): Readable<T | undefined> {
  const engine = useEngine()

  // 创建 Writable Store(内部使用)
  const internalStore = writable<T | undefined>(
    engine.state.get(path) ?? defaultValue
  )

  // 监听引擎状态变化
  const unwatch = engine.state.watch<T>(path, (newValue) => {
    internalStore.set(newValue)
  })

  // 组件销毁时清理
  onDestroy(() => {
    unwatch()
  })

  // 返回只读的 derived store
  return derived(internalStore, $value => $value)
}

/**
 * 简化版:直接返回 Writable Store(不返回元组)
 * 
 * 这是 Svelte 惯用的方式,但为了与 React/Vue 保持一致,
 * 推荐使用 createEngineStore
 * 
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns Writable Store
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEngineState } from '@ldesign/engine-svelte'
 * 
 * const count = useEngineState('count', 0)
 * </script>
 * 
 * <button on:click={() => $count++}>
 *   Count: {$count}
 * </button>
 * ```
 */
export function useEngineState<T>(
  path: string,
  defaultValue?: T
): Writable<T | undefined> {
  const [store] = createEngineStore<T>(path, defaultValue)
  return store
}

/**
 * 简化版:只读状态
 * 
 * @param path - 状态路径
 * @param defaultValue - 默认值
 * @returns Readable Store
 */
export function useEngineStateValue<T>(
  path: string,
  defaultValue?: T
): Readable<T | undefined> {
  return createEngineReadable<T>(path, defaultValue)
}

