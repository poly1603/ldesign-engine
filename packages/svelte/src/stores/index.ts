/**
 * Svelte Stores 集成
 * 
 * 提供与引擎集成的 Svelte stores
 */

import { writable, derived, get, type Readable, type Writable } from 'svelte/store'
import { getContext, setContext, onDestroy } from 'svelte'
import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 引擎上下文键
 */
const ENGINE_CONTEXT_KEY = Symbol('ldesign-engine')

/**
 * 设置引擎到 Svelte 上下文
 * 
 * @param engine - 引擎实例
 * 
 * @example
 * ```svelte
 * <script>
 *   import { setEngineContext } from '@ldesign/engine-svelte'
 *   
 *   setEngineContext(engine)
 * </script>
 * ```
 */
export function setEngineContext(engine: CoreEngine): void {
  setContext(ENGINE_CONTEXT_KEY, engine)
}

/**
 * 从 Svelte 上下文获取引擎
 * 
 * @returns 引擎实例
 * @throws 如果引擎未设置则抛出错误
 * 
 * @example
 * ```svelte
 * <script>
 *   import { getEngineContext } from '@ldesign/engine-svelte'
 *   
 *   const engine = getEngineContext()
 * </script>
 * ```
 */
export function getEngineContext(): CoreEngine {
  const engine = getContext<CoreEngine>(ENGINE_CONTEXT_KEY)
  if (!engine) {
    throw new Error('Engine not found in context. Did you forget to call setEngineContext?')
  }
  return engine
}

/**
 * 创建引擎状态 store
 * 
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 可写的 Svelte store
 * 
 * @example
 * ```svelte
 * <script>
 *   import { createEngineState } from '@ldesign/engine-svelte'
 *   
 *   const count = createEngineState('count', 0)
 * </script>
 * 
 * <button on:click={() => $count++}>
 *   Count: {$count}
 * </button>
 * ```
 */
export function createEngineState<T>(key: string, defaultValue: T): Writable<T> {
  const engine = getEngineContext()
  
  // 初始化状态
  if (!engine.state.has(key)) {
    engine.state.set(key, defaultValue)
  }

  const store = writable(engine.state.get(key) as T)

  // 监听引擎状态变化
  const unwatch = engine.state.watch(key, (newValue: T) => {
    store.set(newValue)
  })

  // 组件销毁时取消监听
  onDestroy(() => {
    unwatch()
  })

  // 重写 set 和 update 方法,同步到引擎
  return {
    subscribe: store.subscribe,
    set: (value: T) => {
      engine.state.set(key, value)
      store.set(value)
    },
    update: (updater: (value: T) => T) => {
      const currentValue = engine.state.get(key) as T
      const newValue = updater(currentValue)
      engine.state.set(key, newValue)
      store.set(newValue)
    },
  }
}

/**
 * 创建只读引擎状态 store
 * 
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 只读的 Svelte store
 * 
 * @example
 * ```svelte
 * <script>
 *   import { createEngineStateReadonly } from '@ldesign/engine-svelte'
 *   
 *   const theme = createEngineStateReadonly('theme', 'light')
 * </script>
 * 
 * <div class={$theme}>
 *   Current theme: {$theme}
 * </div>
 * ```
 */
export function createEngineStateReadonly<T>(key: string, defaultValue: T): Readable<T> {
  const engine = getEngineContext()
  
  if (!engine.state.has(key)) {
    engine.state.set(key, defaultValue)
  }

  const store = writable(engine.state.get(key) as T)

  const unwatch = engine.state.watch(key, (newValue: T) => {
    store.set(newValue)
  })

  onDestroy(() => {
    unwatch()
  })

  return {
    subscribe: store.subscribe,
  }
}

/**
 * 创建计算状态 store
 * 
 * @param getter - 计算函数
 * @returns 只读的 Svelte store
 * 
 * @example
 * ```svelte
 * <script>
 *   import { createEngineState, createComputedState } from '@ldesign/engine-svelte'
 *   
 *   const count = createEngineState('count', 0)
 *   const doubled = createComputedState(() => $count * 2)
 * </script>
 * 
 * <div>
 *   Count: {$count}, Doubled: {$doubled}
 * </div>
 * ```
 */
export function createComputedState<T>(getter: () => T): Readable<T> {
  return derived({ subscribe: (fn: any) => {
    const value = getter()
    fn(value)
    return () => {}
  }}, ($value) => $value)
}

/**
 * 创建事件监听器
 * 
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * 
 * @example
 * ```svelte
 * <script>
 *   import { createEventListener } from '@ldesign/engine-svelte'
 *   
 *   createEventListener('user:login', (user) => {
 *     console.log('User logged in:', user)
 *   })
 * </script>
 * ```
 */
export function createEventListener(event: string, handler: (data: any) => void): void {
  const engine = getEngineContext()
  const unsubscribe = engine.events.on(event, handler)
  
  onDestroy(() => {
    unsubscribe()
  })
}

/**
 * 创建生命周期钩子监听器
 * 
 * @param hook - 钩子名称
 * @param handler - 钩子处理函数
 * 
 * @example
 * ```svelte
 * <script>
 *   import { createLifecycleHook } from '@ldesign/engine-svelte'
 *   
 *   createLifecycleHook('mounted', () => {
 *     console.log('Component mounted!')
 *   })
 * </script>
 * ```
 */
export function createLifecycleHook(hook: string, handler: (data?: any) => void | Promise<void>): void {
  const engine = getEngineContext()
  const unsubscribe = engine.lifecycle.on(hook, handler)
  
  onDestroy(() => {
    unsubscribe()
  })
}

/**
 * 创建插件 store
 * 
 * @param name - 插件名称
 * @returns 插件实例的 Readable store
 * 
 * @example
 * ```svelte
 * <script>
 *   import { createPluginStore } from '@ldesign/engine-svelte'
 *   
 *   const i18nPlugin = createPluginStore('i18n')
 * </script>
 * 
 * {#if $i18nPlugin}
 *   <div>Plugin loaded: {$i18nPlugin.name}</div>
 * {/if}
 * ```
 */
export function createPluginStore(name: string): Readable<any | null> {
  const engine = getEngineContext()
  const store = writable(engine.plugins.get(name) || null)
  
  return {
    subscribe: store.subscribe,
  }
}

/**
 * 触发引擎事件
 * 
 * @param event - 事件名称
 * @param data - 事件数据
 * 
 * @example
 * ```svelte
 * <script>
 *   import { emitEngineEvent } from '@ldesign/engine-svelte'
 * </script>
 * 
 * <button on:click={() => emitEngineEvent('user:logout')}>
 *   Logout
 * </button>
 * ```
 */
export function emitEngineEvent(event: string, data?: any): void {
  const engine = getEngineContext()
  engine.events.emit(event, data)
}

/**
 * 触发异步引擎事件
 * 
 * @param event - 事件名称
 * @param data - 事件数据
 * @returns Promise
 * 
 * @example
 * ```svelte
 * <script>
 *   import { emitEngineEventAsync } from '@ldesign/engine-svelte'
 *   
 *   async function handleClick() {
 *     await emitEngineEventAsync('data:load', { id: 123 })
 *   }
 * </script>
 * 
 * <button on:click={handleClick}>Load Data</button>
 * ```
 */
export async function emitEngineEventAsync(event: string, data?: any): Promise<void> {
  const engine = getEngineContext()
  await engine.events.emitAsync(event, data)
}

/**
 * 执行中间件链
 * 
 * @param context - 中间件上下文
 * @returns Promise
 * 
 * @example
 * ```svelte
 * <script>
 *   import { executeMiddleware } from '@ldesign/engine-svelte'
 *   
 *   async function handleAction() {
 *     await executeMiddleware({ data: { action: 'test' } })
 *   }
 * </script>
 * ```
 */
export async function executeMiddleware(context: any): Promise<void> {
  const engine = getEngineContext()
  await engine.middleware.execute(context)
}

