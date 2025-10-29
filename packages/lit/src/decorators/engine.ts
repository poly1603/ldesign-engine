/**
 * Lit 装饰器
 * 
 * 提供便捷的装饰器用于集成引擎功能
 * 
 * @packageDocumentation
 */

import type { ReactiveControllerHost } from 'lit'
import type { Engine } from '@ldesign/engine-core'
import { StateController, EventController } from '../adapter/lit-adapter'

/**
 * 引擎实例存储
 */
let globalEngine: Engine | undefined

/**
 * 设置全局引擎实例
 * 
 * @param engine - 引擎实例
 */
export function setGlobalEngine(engine: Engine): void {
  globalEngine = engine
}

/**
 * 获取全局引擎实例
 * 
 * @returns 引擎实例
 */
export function getGlobalEngine(): Engine {
  if (!globalEngine) {
    throw new Error('Global engine not set. Call setGlobalEngine() first.')
  }
  return globalEngine
}

/**
 * 状态装饰器
 * 
 * 将类属性绑定到引擎状态
 * 
 * @param path - 状态路径
 * @param initialValue - 初始值
 * 
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @state('counter', 0)
 *   count!: number
 *   
 *   render() {
 *     return html`<div>Count: ${this.count}</div>`
 *   }
 * }
 * ```
 */
export function state<T>(path: string, initialValue?: T) {
  return function (target: any, propertyKey: string) {
    const controllerKey = Symbol(`__controller_${propertyKey}`)
    
    // 在 connectedCallback 中初始化控制器
    const originalConnectedCallback = target.connectedCallback
    target.connectedCallback = function (this: ReactiveControllerHost & any) {
      if (originalConnectedCallback) {
        originalConnectedCallback.call(this)
      }
      
      const engine = getGlobalEngine()
      const controller = new StateController<T>(
        this,
        engine.state,
        path,
        initialValue
      )
      
      this[controllerKey] = controller
    }
    
    // 定义 getter 和 setter
    Object.defineProperty(target, propertyKey, {
      get(this: any) {
        return this[controllerKey]?.value
      },
      set(this: any, value: T) {
        if (this[controllerKey]) {
          this[controllerKey].value = value
        }
      },
      enumerable: true,
      configurable: true,
    })
  }
}

/**
 * 事件监听装饰器
 * 
 * 自动监听引擎事件
 * 
 * @param eventName - 事件名称
 * 
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @listen('user:login')
 *   handleLogin(data: any) {
 *     console.log('User logged in:', data)
 *   }
 * }
 * ```
 */
export function listen(eventName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const controllerKey = Symbol(`__event_controller_${propertyKey}`)
    
    // 在 connectedCallback 中初始化控制器
    const originalConnectedCallback = target.connectedCallback
    target.connectedCallback = function (this: ReactiveControllerHost & any) {
      if (originalConnectedCallback) {
        originalConnectedCallback.call(this)
      }
      
      const engine = getGlobalEngine()
      const controller = new EventController(
        this,
        engine.events,
        eventName,
        originalMethod.bind(this)
      )
      
      this[controllerKey] = controller
    }
    
    return descriptor
  }
}

/**
 * 计算属性装饰器
 * 
 * 创建基于引擎状态的计算属性
 * 
 * @param deps - 依赖的状态路径
 * 
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @state('cart.items', [])
 *   items!: any[]
 *   
 *   @computed(['cart.items'])
 *   get total() {
 *     return this.items.reduce((sum, item) => sum + item.price, 0)
 *   }
 * }
 * ```
 */
export function computed(deps: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalGetter = descriptor.get
    if (!originalGetter) {
      throw new Error('@computed can only be used on getter methods')
    }
    
    const cacheKey = Symbol(`__computed_cache_${propertyKey}`)
    const unwatchersKey = Symbol(`__computed_unwatchers_${propertyKey}`)
    
    // 在 connectedCallback 中设置监听
    const originalConnectedCallback = target.connectedCallback
    target.connectedCallback = function (this: ReactiveControllerHost & any) {
      if (originalConnectedCallback) {
        originalConnectedCallback.call(this)
      }
      
      const engine = getGlobalEngine()
      const unwatchers: Array<() => void> = []
      
      // 监听所有依赖
      deps.forEach(dep => {
        const unwatch = engine.state.watch(dep, () => {
          // 清除缓存
          delete this[cacheKey]
          this.requestUpdate()
        })
        unwatchers.push(unwatch)
      })
      
      this[unwatchersKey] = unwatchers
    }
    
    // 在 disconnectedCallback 中清理
    const originalDisconnectedCallback = target.disconnectedCallback
    target.disconnectedCallback = function (this: any) {
      if (originalDisconnectedCallback) {
        originalDisconnectedCallback.call(this)
      }
      
      const unwatchers = this[unwatchersKey]
      if (unwatchers) {
        unwatchers.forEach((unwatch: () => void) => unwatch())
        delete this[unwatchersKey]
      }
    }
    
    // 修改 getter 添加缓存
    descriptor.get = function (this: any) {
      if (this[cacheKey] === undefined) {
        this[cacheKey] = originalGetter.call(this)
      }
      return this[cacheKey]
    }
    
    return descriptor
  }
}

/**
 * 缓存装饰器
 * 
 * 自动缓存方法结果
 * 
 * @param key - 缓存键
 * @param ttl - 缓存时间 (毫秒)
 * 
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @cache('user:profile', 60000)
 *   async fetchUserProfile(userId: string) {
 *     const res = await fetch(`/api/users/${userId}`)
 *     return res.json()
 *   }
 * }
 * ```
 */
export function cache(key: string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (this: any, ...args: any[]) {
      const engine = getGlobalEngine()
      
      // 检查缓存
      const cached = engine.cache.get(key)
      if (cached !== undefined) {
        return cached
      }
      
      // 执行方法
      const result = await originalMethod.apply(this, args)
      
      // 缓存结果
      engine.cache.set(key, result, ttl)
      
      return result
    }
    
    return descriptor
  }
}

/**
 * 动作装饰器
 * 
 * 标记方法为引擎动作,自动触发事件
 * 
 * @param eventName - 触发的事件名称
 * 
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @action('todo:added')
 *   addTodo(text: string) {
 *     const todos = engine.state.get('todos') || []
 *     engine.state.set('todos', [...todos, { text, done: false }])
 *   }
 * }
 * ```
 */
export function action(eventName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (this: any, ...args: any[]) {
      const engine = getGlobalEngine()
      
      // 执行方法
      const result = await originalMethod.apply(this, args)
      
      // 触发事件
      if (eventName) {
        await engine.events.emit(eventName, { args, result })
      }
      
      return result
    }
    
    return descriptor
  }
}

