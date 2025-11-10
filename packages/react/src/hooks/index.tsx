/**
 * React Hooks for Engine
 * 
 * 提供 React hooks 来访问引擎功能
 * 
 * @module hooks
 */

import { useContext, useEffect, useState, useMemo, createContext } from 'react'
import type { CoreEngine, Plugin } from '@ldesign/engine-core'

/**
 * 引擎上下文
 * 
 * 用于在组件树中传递引擎实例
 */
export const EngineContext = createContext<CoreEngine | null>(null)

/**
 * 使用引擎
 * 
 * 获取引擎实例的 hook
 * 
 * @returns 引擎实例
 * @throws 如果引擎未提供
 * 
 * @example
 * ```tsx
 * import { useEngine } from '@ldesign/engine-react'
 * 
 * function MyComponent() {
 *   const engine = useEngine()
 *   
 *   useEffect(() => {
 *     engine.state.set('count', 0)
 *   }, [engine])
 *   
 *   return <div>Component</div>
 * }
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = useContext(EngineContext)
  if (!engine) {
    throw new Error(
      'Engine not found. Make sure you have wrapped your app with EngineProvider or called createEngineApp.'
    )
  }
  return engine
}

/**
 * 使用插件
 * 
 * 获取已安装的插件实例
 * 
 * @param name - 插件名称
 * @returns 插件实例,如果未找到则返回 undefined
 * 
 * @example
 * ```tsx
 * import { usePlugin } from '@ldesign/engine-react'
 * 
 * function MyComponent() {
 *   const i18nPlugin = usePlugin('i18n')
 *   
 *   if (i18nPlugin) {
 *     console.log('i18n plugin is available')
 *   }
 *   
 *   return <div>Component</div>
 * }
 * ```
 */
export function usePlugin(name: string): Plugin | undefined {
  const engine = useEngine()
  return engine.plugins.get(name)
}

/**
 * 使用状态
 * 
 * 从引擎状态管理器中获取状态,并在状态变化时自动更新组件
 * 
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 状态值
 * 
 * @example
 * ```tsx
 * import { useState } from '@ldesign/engine-react'
 * 
 * function Counter() {
 *   const count = useState<number>('count', 0)
 *   
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => engine.state.set('count', count + 1)}>
 *         Increment
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEngineState<T>(key: string, defaultValue?: T): T {
  const engine = useEngine()
  const [value, setValue] = useState<T>(() => {
    const engineValue = engine.state.get<T>(key)
    return engineValue !== undefined ? engineValue : (defaultValue as T)
  })

  useEffect(() => {
    // 监听状态变化
    const unwatch = engine.state.watch<T>(key, (newValue) => {
      setValue(newValue)
    })

    // 清理监听器
    return unwatch
  }, [engine, key])

  return value
}

/**
 * 使用事件
 * 
 * 监听引擎事件,组件卸载时自动清理监听器
 * 
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * 
 * @example
 * ```tsx
 * import { useEvent } from '@ldesign/engine-react'
 * 
 * function MyComponent() {
 *   useEvent('user:login', (user) => {
 *     console.log('User logged in:', user)
 *   })
 *   
 *   return <div>Component</div>
 * }
 * ```
 */
export function useEvent(event: string, handler: (payload: any) => void): void {
  const engine = useEngine()

  useEffect(() => {
    // 注册事件监听
    const unsubscribe = engine.events.on(event, handler)

    // 清理监听器
    return unsubscribe
  }, [engine, event, handler])
}

/**
 * 使用生命周期
 * 
 * 注册引擎生命周期钩子,组件卸载时自动清理
 * 
 * @param hook - 生命周期钩子名称
 * @param handler - 处理函数
 * 
 * @example
 * ```tsx
 * import { useLifecycle } from '@ldesign/engine-react'
 * 
 * function MyComponent() {
 *   useLifecycle('mounted', () => {
 *     console.log('Component mounted')
 *   })
 *   
 *   return <div>Component</div>
 * }
 * ```
 */
export function useLifecycle(
  hook: string,
  handler: () => void | Promise<void>
): void {
  const engine = useEngine()

  useEffect(() => {
    // 注册生命周期钩子
    engine.lifecycle.on(hook, handler)

    // 清理钩子
    return () => {
      engine.lifecycle.off(hook, handler)
    }
  }, [engine, hook, handler])
}

/**
 * 使用中间件执行
 * 
 * 执行中间件链的 hook
 * 
 * @returns 执行中间件的函数
 * 
 * @example
 * ```tsx
 * import { useMiddleware } from '@ldesign/engine-react'
 * 
 * function MyComponent() {
 *   const executeMiddleware = useMiddleware()
 *   
 *   const handleClick = async () => {
 *     await executeMiddleware({
 *       data: { action: 'click' },
 *       cancelled: false
 *     })
 *   }
 *   
 *   return <button onClick={handleClick}>Click</button>
 * }
 * ```
 */
export function useMiddleware() {
  const engine = useEngine()
  
  return useMemo(
    () => async <T = any>(context: { data: T; cancelled: boolean }) => {
      await engine.middleware.execute(context)
    },
    [engine]
  )
}

/**
 * 引擎提供者组件
 * 
 * 用于在组件树中提供引擎实例
 * 
 * @example
 * ```tsx
 * import { EngineProvider } from '@ldesign/engine-react'
 * import { createCoreEngine } from '@ldesign/engine-core'
 * 
 * const engine = createCoreEngine()
 * await engine.init()
 * 
 * function App() {
 *   return (
 *     <EngineProvider engine={engine}>
 *       <YourApp />
 *     </EngineProvider>
 *   )
 * }
 * ```
 */
export function EngineProvider({
  engine,
  children,
}: {
  engine: CoreEngine
  children: React.ReactNode
}) {
  return (
    <EngineContext.Provider value={engine}>
      {children}
    </EngineContext.Provider>
  )
}

