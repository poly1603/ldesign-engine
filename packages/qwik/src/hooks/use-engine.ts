/**
 * Qwik Hooks for Engine Integration
 * 
 * @packageDocumentation
 */

import { useContext, useSignal, useTask$, useVisibleTask$, type Signal } from '@builder.io/qwik'
import type { Engine, StateManager, EventManager } from '@ldesign/engine-core'

/**
 * Engine Context (需要在应用根部提供)
 */
export const EngineContext = Symbol('engine-context')

/**
 * 使用引擎实例
 * 
 * @returns Engine 实例
 * 
 * @example
 * ```tsx
 * export const MyComponent = component$(() => {
 *   const engine = useEngine()
 *   
 *   return <div>Engine: {engine.name}</div>
 * })
 * ```
 */
export function useEngine(): Engine {
  const engine = useContext(EngineContext)
  if (!engine) {
    throw new Error('Engine context not found. Did you forget to provide it?')
  }
  return engine as Engine
}

/**
 * 使用引擎状态
 * 
 * @param path - 状态路径
 * @param initialValue - 初始值
 * @returns Signal 包装的状态值
 * 
 * @example
 * ```tsx
 * export const Counter = component$(() => {
 *   const count = useEngineState('counter', 0)
 *   
 *   return (
 *     <div>
 *       <p>Count: {count.value}</p>
 *       <button onClick$={() => count.value++}>Increment</button>
 *     </div>
 *   )
 * })
 * ```
 */
export function useEngineState<T>(path: string, initialValue?: T): Signal<T> {
  const engine = useEngine()
  const state = useSignal<T>(initialValue as T)
  
  // 服务端: 直接从状态管理器获取
  if (typeof window === 'undefined') {
    const value = engine.state.get<T>(path)
    if (value !== undefined) {
      state.value = value
    } else if (initialValue !== undefined) {
      engine.state.set(path, initialValue)
      state.value = initialValue
    }
  }
  
  // 客户端: 监听状态变化
  useVisibleTask$(({ track, cleanup }) => {
    track(() => state.value)
    
    // 初始化
    const value = engine.state.get<T>(path)
    if (value !== undefined) {
      state.value = value
    } else if (initialValue !== undefined) {
      engine.state.set(path, initialValue)
    }
    
    // 监听状态变化
    const unwatch = engine.state.watch<T>(path, (newValue) => {
      state.value = newValue
    })
    
    // 监听 Signal 变化并同步到状态管理器
    const updateState = () => {
      engine.state.set(path, state.value)
    }
    
    cleanup(() => {
      unwatch()
    })
  })
  
  return state
}

/**
 * 使用引擎事件
 * 
 * @param eventName - 事件名称
 * @param handler - 事件处理函数
 * 
 * @example
 * ```tsx
 * export const Notification = component$(() => {
 *   const message = useSignal('')
 *   
 *   useEngineEvent('notification', (data) => {
 *     message.value = data.message
 *   })
 *   
 *   return <div>{message.value}</div>
 * })
 * ```
 */
export function useEngineEvent<T = any>(
  eventName: string,
  handler: (data: T) => void | Promise<void>
): void {
  const engine = useEngine()
  
  useVisibleTask$(({ cleanup }) => {
    const unsubscribe = engine.events.on<T>(eventName, handler)
    
    cleanup(() => {
      unsubscribe()
    })
  })
}

/**
 * 使用引擎缓存
 * 
 * @param key - 缓存键
 * @param fetcher - 数据获取函数
 * @param options - 缓存选项
 * @returns Signal 包装的缓存值
 * 
 * @example
 * ```tsx
 * export const UserProfile = component$(() => {
 *   const user = useEngineCache(
 *     'user:123',
 *     async () => {
 *       const res = await fetch('/api/user/123')
 *       return res.json()
 *     },
 *     { ttl: 60000 }
 *   )
 *   
 *   return <div>{user.value?.name}</div>
 * })
 * ```
 */
export function useEngineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): Signal<T | undefined> {
  const engine = useEngine()
  const data = useSignal<T | undefined>(undefined)
  const loading = useSignal(false)
  
  useTask$(async () => {
    // 检查缓存
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      data.value = cached
      return
    }
    
    // 获取数据
    if (!loading.value) {
      loading.value = true
      try {
        const result = await fetcher()
        engine.cache.set(key, result, options?.ttl)
        data.value = result
      } catch (error) {
        console.error(`[useEngineCache] 获取数据失败:`, error)
      } finally {
        loading.value = false
      }
    }
  })
  
  return data
}

/**
 * 使用引擎计算属性
 * 
 * @param getter - 计算函数
 * @param deps - 依赖的状态路径
 * @returns Signal 包装的计算值
 * 
 * @example
 * ```tsx
 * export const Cart = component$(() => {
 *   const items = useEngineState('cart.items', [])
 *   const total = useEngineComputed(
 *     () => items.value.reduce((sum, item) => sum + item.price, 0),
 *     ['cart.items']
 *   )
 *   
 *   return <div>Total: ${total.value}</div>
 * })
 * ```
 */
export function useEngineComputed<T>(
  getter: () => T,
  deps: string[]
): Signal<T> {
  const engine = useEngine()
  const computed = useSignal<T>(getter())
  
  useVisibleTask$(({ cleanup }) => {
    // 监听所有依赖
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => {
        computed.value = getter()
      })
    )
    
    cleanup(() => {
      unwatchers.forEach(unwatch => unwatch())
    })
  })
  
  return computed
}

/**
 * 使用引擎动作
 * 
 * @param action - 动作函数
 * @returns 包装后的动作函数
 * 
 * @example
 * ```tsx
 * export const TodoList = component$(() => {
 *   const addTodo = useEngineAction(async (text: string) => {
 *     const engine = useEngine()
 *     const todos = engine.state.get('todos') || []
 *     engine.state.set('todos', [...todos, { text, done: false }])
 *     await engine.events.emit('todo:added', { text })
 *   })
 *   
 *   return <button onClick$={() => addTodo('New todo')}>Add</button>
 * })
 * ```
 */
export function useEngineAction<T extends (...args: any[]) => any>(
  action: T
): T {
  const engine = useEngine()
  
  return ((...args: any[]) => {
    return action(...args)
  }) as T
}

/**
 * 使用引擎插件
 * 
 * @param pluginName - 插件名称
 * @returns 插件实例
 * 
 * @example
 * ```tsx
 * export const Analytics = component$(() => {
 *   const analytics = useEnginePlugin('analytics')
 *   
 *   return (
 *     <button onClick$={() => analytics?.track('click')}>
 *       Track Click
 *     </button>
 *   )
 * })
 * ```
 */
export function useEnginePlugin(pluginName: string): any {
  const engine = useEngine()
  return engine.plugins.get(pluginName)
}

