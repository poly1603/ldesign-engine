/**
 * Solid Signals 集成
 * 
 * 提供与引擎集成的 Solid signals 和 utilities
 */

import { createSignal, createEffect, createMemo, onCleanup, useContext, createContext } from 'solid-js'
import type { Context } from 'solid-js'
import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 引擎上下文
 */
export const EngineContext: Context<CoreEngine | undefined> = createContext<CoreEngine | undefined>()

/**
 * 获取引擎实例
 * 
 * @returns 引擎实例
 * @throws 如果引擎未设置则抛出错误
 * 
 * @example
 * ```tsx
 * import { useEngine } from '@ldesign/engine-solid'
 * 
 * function MyComponent() {
 *   const engine = useEngine()
 *   return <div>Engine: {engine.config.name}</div>
 * }
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = useContext(EngineContext)
  if (!engine) {
    throw new Error('Engine not found in context. Did you forget to wrap your app with EngineProvider?')
  }
  return engine
}

/**
 * 创建引擎状态 signal
 * 
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns Solid signal [getter, setter]
 * 
 * @example
 * ```tsx
 * import { useEngineState } from '@ldesign/engine-solid'
 * 
 * function Counter() {
 *   const [count, setCount] = useEngineState('count', 0)
 *   return (
 *     <button onClick={() => setCount(count() + 1)}>
 *       Count: {count()}
 *     </button>
 *   )
 * }
 * ```
 */
export function useEngineState<T>(key: string, defaultValue: T): [() => T, (value: T) => void] {
  const engine = useEngine()
  
  // 初始化状态
  if (!engine.state.has(key)) {
    engine.state.set(key, defaultValue)
  }

  const [state, setState] = createSignal(engine.state.get(key) as T)

  // 监听引擎状态变化
  createEffect(() => {
    const unwatch = engine.state.watch(key, (newValue: T) => {
      setState(() => newValue)
    })

    onCleanup(() => {
      unwatch()
    })
  })

  // 创建 setter,同步到引擎
  const setEngineState = (value: T) => {
    engine.state.set(key, value)
    setState(() => value)
  }

  return [state, setEngineState]
}

/**
 * 创建只读引擎状态 signal
 * 
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 只读的 Solid signal
 * 
 * @example
 * ```tsx
 * import { useEngineStateReadonly } from '@ldesign/engine-solid'
 * 
 * function ThemeDisplay() {
 *   const theme = useEngineStateReadonly('theme', 'light')
 *   return <div class={theme()}>Current theme: {theme()}</div>
 * }
 * ```
 */
export function useEngineStateReadonly<T>(key: string, defaultValue: T): () => T {
  const engine = useEngine()
  
  if (!engine.state.has(key)) {
    engine.state.set(key, defaultValue)
  }

  const [state, setState] = createSignal(engine.state.get(key) as T)

  createEffect(() => {
    const unwatch = engine.state.watch(key, (newValue: T) => {
      setState(() => newValue)
    })

    onCleanup(() => {
      unwatch()
    })
  })

  return state
}

/**
 * 创建计算状态 memo
 * 
 * @param getter - 计算函数
 * @returns Solid memo
 * 
 * @example
 * ```tsx
 * import { useEngineState, useComputedState } from '@ldesign/engine-solid'
 * 
 * function DoubledCounter() {
 *   const [count] = useEngineState('count', 0)
 *   const doubled = useComputedState(() => count() * 2)
 *   return <div>Doubled: {doubled()}</div>
 * }
 * ```
 */
export function useComputedState<T>(getter: () => T): () => T {
  return createMemo(getter)
}

/**
 * 监听引擎事件
 * 
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * 
 * @example
 * ```tsx
 * import { useEvent } from '@ldesign/engine-solid'
 * 
 * function LoginListener() {
 *   useEvent('user:login', (user) => {
 *     console.log('User logged in:', user)
 *   })
 *   return <div>Listening for login events...</div>
 * }
 * ```
 */
export function useEvent(event: string, handler: (data: any) => void): void {
  const engine = useEngine()

  createEffect(() => {
    const unsubscribe = engine.events.on(event, handler)

    onCleanup(() => {
      unsubscribe()
    })
  })
}

/**
 * 监听生命周期钩子
 * 
 * @param hook - 钩子名称
 * @param handler - 钩子处理函数
 * 
 * @example
 * ```tsx
 * import { useLifecycle } from '@ldesign/engine-solid'
 * 
 * function MountedLogger() {
 *   useLifecycle('mounted', () => {
 *     console.log('Component mounted!')
 *   })
 *   return <div>Component</div>
 * }
 * ```
 */
export function useLifecycle(hook: string, handler: (data?: any) => void | Promise<void>): void {
  const engine = useEngine()

  createEffect(() => {
    const unsubscribe = engine.lifecycle.on(hook, handler)

    onCleanup(() => {
      unsubscribe()
    })
  })
}

/**
 * 获取插件实例
 * 
 * @param name - 插件名称
 * @returns 插件实例 signal
 * 
 * @example
 * ```tsx
 * import { usePlugin } from '@ldesign/engine-solid'
 * 
 * function I18nComponent() {
 *   const i18n = usePlugin('i18n')
 *   return <div>{i18n() ? 'Plugin loaded' : 'Loading...'}</div>
 * }
 * ```
 */
export function usePlugin(name: string): () => any | null {
  const engine = useEngine()
  const [plugin, setPlugin] = createSignal(engine.plugins.get(name) || null)

  createEffect(() => {
    setPlugin(() => engine.plugins.get(name) || null)
  })

  return plugin
}

/**
 * 触发引擎事件
 * 
 * @param event - 事件名称
 * @param data - 事件数据
 * 
 * @example
 * ```tsx
 * import { emitEngineEvent } from '@ldesign/engine-solid'
 * 
 * function LogoutButton() {
 *   return (
 *     <button onClick={() => emitEngineEvent('user:logout')}>
 *       Logout
 *     </button>
 *   )
 * }
 * ```
 */
export function emitEngineEvent(event: string, data?: any): void {
  const engine = useEngine()
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
 * ```tsx
 * import { emitEngineEventAsync } from '@ldesign/engine-solid'
 * 
 * function LoadDataButton() {
 *   const handleClick = async () => {
 *     await emitEngineEventAsync('data:load', { id: 123 })
 *   }
 *   return <button onClick={handleClick}>Load Data</button>
 * }
 * ```
 */
export async function emitEngineEventAsync(event: string, data?: any): Promise<void> {
  const engine = useEngine()
  await engine.events.emitAsync(event, data)
}

/**
 * 执行中间件链
 * 
 * @param context - 中间件上下文
 * @returns Promise
 * 
 * @example
 * ```tsx
 * import { executeMiddleware } from '@ldesign/engine-solid'
 * 
 * function ActionButton() {
 *   const handleAction = async () => {
 *     await executeMiddleware({ data: { action: 'test' } })
 *   }
 *   return <button onClick={handleAction}>Execute</button>
 * }
 * ```
 */
export async function executeMiddleware(context: any): Promise<void> {
  const engine = useEngine()
  await engine.middleware.execute(context)
}

