/**
 * Svelte Stores for @ldesign/engine
 */

import { writable, readable, derived, get } from 'svelte/store'
import type { Writable, Readable, Unsubscriber } from 'svelte/store'
import type { CoreEngine, Plugin } from '@ldesign/engine-core'

let engineInstance: CoreEngine | null = null

/**
 * 设置引擎实例
 * 
 * @param engine - 引擎实例
 * 
 * @example
 * ```ts
 * import { createEngine } from '@ldesign/engine-core'
 * import { setEngine } from '@ldesign/engine-svelte'
 * 
 * const engine = createEngine({ ... })
 * await engine.initialize()
 * setEngine(engine)
 * ```
 */
export function setEngine(engine: CoreEngine): void {
  engineInstance = engine
  engineStore.set(engine)
}

/**
 * 获取引擎实例
 * 
 * @returns 引擎实例
 * @throws 如果引擎未设置
 */
export function getEngine(): CoreEngine {
  if (!engineInstance) {
    throw new Error('[getEngine] Engine not initialized. Call setEngine() first.')
  }
  return engineInstance
}

/**
 * 引擎 store
 */
export const engineStore = writable<CoreEngine | null>(null)

/**
 * 创建插件 store
 * 
 * @param pluginName - 插件名称
 * @returns 插件的可读 store
 * 
 * @example
 * ```svelte
 * <script>
 * import { createPluginStore } from '@ldesign/engine-svelte'
 * 
 * const i18nPlugin = createPluginStore('i18n')
 * </script>
 * 
 * {#if $i18nPlugin}
 *   <p>Plugin loaded: {$i18nPlugin.name}</p>
 * {/if}
 * ```
 */
export function createPluginStore(pluginName: string): Readable<Plugin | undefined> {
  return readable<Plugin | undefined>(undefined, (set) => {
    const engine = getEngine()
    
    // 初始值
    set(engine.plugins.get(pluginName))
    
    // 监听插件注册
    const unsubscribe = engine.events.on('plugin:registered', (data: any) => {
      if (data.name === pluginName) {
        set(engine.plugins.get(pluginName))
      }
    })
    
    return unsubscribe
  })
}

/**
 * 创建引擎状态 store
 * 
 * @param path - 状态路径
 * @param initialValue - 初始值
 * @returns 可写的状态 store
 * 
 * @example
 * ```svelte
 * <script>
 * import { createEngineStateStore } from '@ldesign/engine-svelte'
 * 
 * const count = createEngineStateStore('app.count', 0)
 * 
 * function increment() {
 *   $count++
 * }
 * </script>
 * 
 * <p>Count: {$count}</p>
 * <button on:click={increment}>+1</button>
 * ```
 */
export function createEngineStateStore<T>(
  path: string,
  initialValue?: T
): Writable<T> {
  const engine = getEngine()
  const value = engine.state.getState(path) ?? initialValue
  
  const store = writable<T>(value)
  
  // 监听引擎状态变化
  const unwatch = engine.state.watch(path, (newValue) => {
    store.set(newValue as T)
  })
  
  // 重写 set 方法以同步到引擎
  const originalSet = store.set
  store.set = (value: T) => {
    engine.state.setState(path, value)
    originalSet(value)
  }
  
  // 重写 update 方法
  const originalUpdate = store.update
  store.update = (updater: (value: T) => T) => {
    const currentValue = get(store)
    const newValue = updater(currentValue)
    engine.state.setState(path, newValue)
    originalSet(newValue)
  }
  
  return store
}

/**
 * 创建引擎配置 store
 * 
 * @param key - 配置键
 * @param defaultValue - 默认值
 * @returns 配置的可读 store
 * 
 * @example
 * ```svelte
 * <script>
 * import { createEngineConfigStore } from '@ldesign/engine-svelte'
 * 
 * const apiUrl = createEngineConfigStore('apiUrl', 'https://api.example.com')
 * </script>
 * 
 * <p>API: {$apiUrl}</p>
 * ```
 */
export function createEngineConfigStore<T>(
  key: string,
  defaultValue?: T
): Readable<T> {
  return readable<T>(defaultValue as T, (set) => {
    const engine = getEngine()
    
    // 初始值
    set(engine.config.get(key, defaultValue))
    
    // 监听配置变化
    const unwatch = engine.config.watch(key, (newValue) => {
      set(newValue as T)
    })
    
    return unwatch
  })
}

/**
 * 创建引擎事件 store
 * 
 * @param eventName - 事件名称
 * @returns 事件数据的可读 store
 * 
 * @example
 * ```svelte
 * <script>
 * import { createEngineEventStore } from '@ldesign/engine-svelte'
 * 
 * const themeChanged = createEngineEventStore('theme:changed')
 * </script>
 * 
 * {#if $themeChanged}
 *   <p>Theme changed to: {$themeChanged.to}</p>
 * {/if}
 * ```
 */
export function createEngineEventStore<T = any>(
  eventName: string
): Readable<T | null> {
  return readable<T | null>(null, (set) => {
    const engine = getEngine()
    
    const unsubscribe = engine.events.on(eventName, (data: T) => {
      set(data)
    })
    
    return unsubscribe
  })
}

/**
 * 创建引擎状态 store
 * 
 * @returns 引擎状态的可读 store
 * 
 * @example
 * ```svelte
 * <script>
 * import { createEngineStatusStore } from '@ldesign/engine-svelte'
 * 
 * const status = createEngineStatusStore()
 * </script>
 * 
 * <div>
 *   <p>Initialized: {$status.initialized ? 'Yes' : 'No'}</p>
 *   <p>Plugins: {$status.pluginCount}</p>
 * </div>
 * ```
 */
export function createEngineStatusStore(): Readable<any> {
  return readable({}, (set) => {
    const engine = getEngine()
    
    // 初始值
    set(engine.getStatus())
    
    // 定期更新
    const interval = setInterval(() => {
      set(engine.getStatus())
    }, 1000)
    
    return () => clearInterval(interval)
  })
}
