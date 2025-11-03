/**
 * Solid.js Signals for @ldesign/engine
 */

import { createSignal, createEffect, onCleanup, createMemo } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
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
 * import { setEngine } from '@ldesign/engine-solid'
 * 
 * const engine = createEngine({ ... })
 * await engine.initialize()
 * setEngine(engine)
 * ```
 */
export function setEngine(engine: CoreEngine): void {
  engineInstance = engine
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
 * 创建引擎信号
 * 
 * @returns 引擎的响应式信号
 * 
 * @example
 * ```tsx
 * function App() {
 *   const engine = useEngine()
 *   
 *   return <div>Engine: {engine().name}</div>
 * }
 * ```
 */
export function useEngine(): Accessor<CoreEngine> {
  const engine = getEngine()
  const [engineSignal] = createSignal(engine)
  return engineSignal
}

/**
 * 创建插件信号
 * 
 * @param pluginName - 插件名称
 * @returns 插件的响应式信号
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const i18nPlugin = usePlugin('i18n')
 *   
 *   return (
 *     <Show when={i18nPlugin()}>
 *       <p>Plugin loaded: {i18nPlugin()?.name}</p>
 *     </Show>
 *   )
 * }
 * ```
 */
export function usePlugin(pluginName: string): Accessor<Plugin | undefined> {
  const engine = getEngine()
  const [plugin, setPlugin] = createSignal<Plugin | undefined>(
    engine.plugins.get(pluginName)
  )
  
  // 监听插件注册
  createEffect(() => {
    const unsubscribe = engine.events.on('plugin:registered', (data: any) => {
      if (data.name === pluginName) {
        setPlugin(engine.plugins.get(pluginName))
      }
    })
    
    onCleanup(unsubscribe)
  })
  
  return plugin
}

/**
 * 创建引擎状态信号
 * 
 * @param path - 状态路径
 * @param initialValue - 初始值
 * @returns 状态的响应式信号和设置函数
 * 
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useEngineState<number>('app.count', 0)
 *   
 *   return (
 *     <div>
 *       <p>Count: {count()}</p>
 *       <button onClick={() => setCount(count() + 1)}>+1</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEngineState<T>(
  path: string,
  initialValue?: T
): [Accessor<T>, Setter<T>] {
  const engine = getEngine()
  const value = engine.state.getState(path) ?? initialValue
  
  const [state, setState] = createSignal<T>(value as T)
  
  // 监听引擎状态变化
  createEffect(() => {
    const unwatch = engine.state.watch(path, (newValue) => {
      setState(() => newValue as T)
    })
    
    onCleanup(unwatch)
  })
  
  // 包装 setState 以同步到引擎
  const setEngineState: Setter<T> = (value) => {
    const newValue = typeof value === 'function' 
      ? (value as (prev: T) => T)(state())
      : value
    
    engine.state.setState(path, newValue)
    setState(() => newValue)
  }
  
  return [state, setEngineState]
}

/**
 * 创建引擎配置信号
 * 
 * @param key - 配置键
 * @param defaultValue - 默认值
 * @returns 配置的响应式信号
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const apiUrl = useEngineConfig('apiUrl', 'https://api.example.com')
 *   
 *   return <div>API: {apiUrl()}</div>
 * }
 * ```
 */
export function useEngineConfig<T>(
  key: string,
  defaultValue?: T
): Accessor<T> {
  const engine = getEngine()
  const [config, setConfig] = createSignal<T>(
    engine.config.get(key, defaultValue)
  )
  
  createEffect(() => {
    const unwatch = engine.config.watch(key, (newValue) => {
      setConfig(() => newValue as T)
    })
    
    onCleanup(unwatch)
  })
  
  return config
}

/**
 * 监听引擎事件
 * 
 * @param eventName - 事件名称
 * @param handler - 事件处理器
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useEngineEvent('theme:changed', (data) => {
 *     console.log('Theme changed to:', data.to)
 *   })
 *   
 *   return <div>Listening to theme changes</div>
 * }
 * ```
 */
export function useEngineEvent(
  eventName: string,
  handler: (data: any) => void
): void {
  const engine = getEngine()
  
  createEffect(() => {
    const unsubscribe = engine.events.on(eventName, handler)
    onCleanup(unsubscribe)
  })
}

/**
 * 创建引擎事件信号
 * 
 * @param eventName - 事件名称
 * @returns 事件数据的响应式信号
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const themeChanged = useEngineEventSignal('theme:changed')
 *   
 *   return (
 *     <Show when={themeChanged()}>
 *       <p>Theme changed to: {themeChanged()?.to}</p>
 *     </Show>
 *   )
 * }
 * ```
 */
export function useEngineEventSignal<T = any>(
  eventName: string
): Accessor<T | null> {
  const engine = getEngine()
  const [event, setEvent] = createSignal<T | null>(null)
  
  createEffect(() => {
    const unsubscribe = engine.events.on(eventName, (data: T) => {
      setEvent(() => data)
    })
    
    onCleanup(unsubscribe)
  })
  
  return event
}

/**
 * 获取引擎日志器
 * 
 * @returns 日志器实例
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const logger = useEngineLogger()
 *   
 *   onMount(() => {
 *     logger.info('Component mounted')
 *   })
 *   
 *   return <div>Check console</div>
 * }
 * ```
 */
export function useEngineLogger() {
  const engine = getEngine()
  return engine.logger
}

/**
 * 创建引擎状态信号
 * 
 * @returns 引擎状态的响应式信号
 * 
 * @example
 * ```tsx
 * function StatusComponent() {
 *   const status = useEngineStatus()
 *   
 *   return (
 *     <div>
 *       <p>Initialized: {status().initialized ? 'Yes' : 'No'}</p>
 *       <p>Plugins: {status().pluginCount}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEngineStatus(): Accessor<any> {
  const engine = getEngine()
  const [status, setStatus] = createSignal(engine.getStatus())
  
  createEffect(() => {
    const interval = setInterval(() => {
      setStatus(engine.getStatus())
    }, 1000)
    
    onCleanup(() => clearInterval(interval))
  })
  
  return status
}
