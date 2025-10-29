/**
 * React Hooks for @ldesign/engine
 */

import { useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { CoreEngine, Plugin } from '@ldesign/engine-core'
import { EngineContext } from '../context'

/**
 * 获取引擎实例
 * 
 * @returns 引擎实例
 * @throws 如果在 EngineProvider 外部使用
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const engine = useEngine()
 *   
 *   const switchTheme = () => {
 *     engine.setTheme('dark')
 *   }
 *   
 *   return <button onClick={switchTheme}>Switch Theme</button>
 * }
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = useContext(EngineContext)
  
  if (!engine) {
    throw new Error('[useEngine] Must be used within EngineProvider')
  }
  
  return engine
}

/**
 * 获取特定插件
 * 
 * @param pluginName - 插件名称
 * @returns 插件实例或 undefined
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const i18nPlugin = usePlugin('i18n')
 *   
 *   if (!i18nPlugin) {
 *     return <div>Loading...</div>
 *   }
 *   
 *   return <div>Plugin loaded</div>
 * }
 * ```
 */
export function usePlugin(pluginName: string): Plugin | undefined {
  const engine = useEngine()
  const [plugin, setPlugin] = useState<Plugin | undefined>(() => 
    engine.plugins.get(pluginName)
  )
  
  useEffect(() => {
    // 监听插件注册事件
    const unsubscribe = engine.events.on('plugin:registered', (data: any) => {
      if (data.name === pluginName) {
        setPlugin(engine.plugins.get(pluginName))
      }
    })
    
    return unsubscribe
  }, [engine, pluginName])
  
  return plugin
}

/**
 * 监听引擎事件
 * 
 * @param event - 事件名称
 * @param handler - 事件处理器
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useEngineEvent('theme:changed', (data) => {
 *     console.log('Theme changed:', data.to)
 *   })
 *   
 *   return <div>Listening to theme changes</div>
 * }
 * ```
 */
export function useEngineEvent(
  event: string,
  handler: (data: any) => void
): void {
  const engine = useEngine()
  
  useEffect(() => {
    const unsubscribe = engine.events.on(event, handler)
    return unsubscribe
  }, [engine, event, handler])
}

/**
 * 获取和设置引擎状态
 * 
 * @param path - 状态路径
 * @returns [state, setState] 元组
 * 
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useEngineState<number>('counter', 0)
 *   
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>+1</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEngineState<T>(
  path: string,
  initialValue?: T
): [T, (value: T) => void] {
  const engine = useEngine()
  
  const [state, setState] = useState<T>(() => {
    const value = engine.state.getState(path)
    return value !== undefined ? value : initialValue
  })
  
  // 监听状态变化
  useEffect(() => {
    const unwatch = engine.state.watch(path, (newValue) => {
      setState(newValue as T)
    })
    
    return unwatch
  }, [engine, path])
  
  // 设置状态
  const setEngineState = useCallback((value: T) => {
    engine.state.setState(path, value)
  }, [engine, path])
  
  return [state, setEngineState]
}

/**
 * 获取引擎配置
 * 
 * @param key - 配置键
 * @param defaultValue - 默认值
 * @returns 配置值
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const apiUrl = useEngineConfig('apiUrl', 'https://api.example.com')
 *   
 *   return <div>API: {apiUrl}</div>
 * }
 * ```
 */
export function useEngineConfig<T>(key: string, defaultValue?: T): T {
  const engine = useEngine()
  const [value, setValue] = useState<T>(() => 
    engine.config.get(key, defaultValue)
  )
  
  useEffect(() => {
    const unwatch = engine.config.watch(key, (newValue) => {
      setValue(newValue as T)
    })
    
    return unwatch
  }, [engine, key])
  
  return value
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
 *   useEffect(() => {
 *     logger.info('Component mounted')
 *     return () => logger.info('Component unmounted')
 *   }, [logger])
 *   
 *   return <div>Check console</div>
 * }
 * ```
 */
export function useEngineLogger() {
  const engine = useEngine()
  return useMemo(() => engine.logger, [engine])
}

/**
 * 获取引擎状态
 * 
 * @returns 引擎状态对象
 * 
 * @example
 * ```tsx
 * function StatusComponent() {
 *   const status = useEngineStatus()
 *   
 *   return (
 *     <div>
 *       <p>Initialized: {status.initialized ? 'Yes' : 'No'}</p>
 *       <p>Plugins: {status.pluginCount}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEngineStatus() {
  const engine = useEngine()
  const [status, setStatus] = useState(() => engine.getStatus())
  
  useEffect(() => {
    // 定期更新状态
    const interval = setInterval(() => {
      setStatus(engine.getStatus())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [engine])
  
  return status
}
