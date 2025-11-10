/**
 * Svelte 框架适配器
 * 
 * 支持 Svelte 4 和 Svelte 5
 */

import { writable, derived, get } from 'svelte/store'
import type {
  FrameworkAdapter,
  FrameworkInfo,
  StateAdapter,
  EventAdapter,
  LifecycleHookMap,
  CoreEngine,
  ReactiveState,
  Unsubscribe,
} from '@ldesign/engine-core'

/**
 * Svelte 框架信息
 */
const SVELTE_INFO: FrameworkInfo = {
  name: 'svelte',
  version: '4.x/5.x',
  features: {
    reactive: true,
    components: true,
    directives: false,
    slots: true,
  },
}

/**
 * Svelte 状态适配器
 * 
 * 使用 Svelte stores 实现响应式状态管理
 */
class SvelteStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   * 
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    const store = writable(initialValue)
    const initial = JSON.parse(JSON.stringify(initialValue))

    return {
      get value() {
        return get(store)
      },
      set value(newValue: T) {
        store.set(newValue)
      },
      readonly() {
        return get(store)
      },
      update(updater: (prev: T) => T) {
        store.update(updater)
      },
      reset() {
        store.set(JSON.parse(JSON.stringify(initial)))
      },
      // 暴露 Svelte store 以便在组件中使用
      subscribe: store.subscribe,
    } as ReactiveState<T> & { subscribe: typeof store.subscribe }
  }

  /**
   * 监听状态变化
   * 
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调函数
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    const derivedStore = derived(
      {
        subscribe: (fn: any) => {
          let currentValue = getter()
          const unsubscribe = setInterval(() => {
            const newValue = getter()
            if (newValue !== currentValue) {
              currentValue = newValue
              fn(newValue)
            }
          }, 16) // 约 60fps
          return () => clearInterval(unsubscribe)
        }
      },
      ($value) => $value
    )

    let oldValue: T | undefined
    const unsubscribe = derivedStore.subscribe((value) => {
      if (oldValue !== undefined) {
        callback(value, oldValue)
      }
      oldValue = value
    })

    return unsubscribe
  }

  /**
   * 批量更新状态
   * 
   * Svelte 自动批量更新,所以直接执行函数即可
   * 
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    fn()
  }

  /**
   * 创建计算属性
   * 
   * @param getter - 计算函数
   * @returns 只读的响应式状态
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    const derivedStore = derived(
      {
        subscribe: (fn: any) => {
          let currentValue = getter()
          const unsubscribe = setInterval(() => {
            const newValue = getter()
            if (newValue !== currentValue) {
              currentValue = newValue
              fn(newValue)
            }
          }, 16)
          return () => clearInterval(unsubscribe)
        }
      },
      ($value) => $value
    )

    return {
      get value() {
        return get(derivedStore)
      },
      set value(_newValue: T) {
        console.warn('Cannot set computed property')
      },
      readonly() {
        return get(derivedStore)
      },
      update(_updater: (prev: T) => T) {
        console.warn('Cannot update computed property')
      },
      // 暴露 Svelte store
      subscribe: derivedStore.subscribe,
    } as ReactiveState<T> & { subscribe: typeof derivedStore.subscribe }
  }
}

/**
 * Svelte 事件适配器
 * 
 * 使用简单的发布订阅模式实现事件系统
 */
class SvelteEventAdapter implements EventAdapter {
  private listeners = new Map<string, Set<(payload: any) => void>>()

  /**
   * 触发事件
   * 
   * @param event - 事件名称
   * @param payload - 事件数据
   */
  emit(event: string, payload?: any): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(payload))
    }
  }

  /**
   * 监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数
   * @returns 取消监听的函数
   */
  on(event: string, handler: (payload: any) => void): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    return () => {
      const handlers = this.listeners.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  /**
   * 监听事件一次
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数
   * @returns 取消监听的函数
   */
  once(event: string, handler: (payload: any) => void): Unsubscribe {
    const wrapper = (payload: any) => {
      handler(payload)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  /**
   * 取消监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数(可选)
   */
  off(event: string, handler?: (payload: any) => void): void {
    if (handler) {
      const handlers = this.listeners.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.listeners.delete(event)
        }
      }
    } else {
      this.listeners.delete(event)
    }
  }
}

/**
 * Svelte 框架适配器
 */
export class SvelteAdapter implements FrameworkAdapter<any, any> {
  readonly info = SVELTE_INFO
  private engineStore = writable<CoreEngine | null>(null)

  /**
   * 创建 Svelte 应用
   * 
   * @param rootComponent - 根组件
   * @param options - 应用选项
   * @returns Svelte 应用实例
   */
  createApp(rootComponent: any, options?: any): any {
    return {
      component: rootComponent,
      options: options || {},
    }
  }

  /**
   * 挂载应用
   *
   * @param app - Svelte 应用实例
   * @param mountElement - 挂载元素
   */
  async mount(app: any, mountElement: string | Element): Promise<void> {
    const target = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (!target) {
      throw new Error(`Mount element not found: ${mountElement}`)
    }

    const component = app.component
    const props = app.options.props || {}

    try {
      // 尝试使用 Svelte 5 的 mount 函数
      const { mount } = await import('svelte')
      mount(component, {
        target,
        props,
      })
    } catch (error) {
      // 如果 Svelte 5 的 mount 不可用,尝试 Svelte 4 的构造函数方式
      try {
        new component({
          target,
          props,
        })
      } catch (innerError) {
        throw new Error(`Failed to mount Svelte component: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * 卸载应用
   * 
   * @param app - Svelte 应用实例
   */
  async unmount(app: any): Promise<void> {
    // Svelte 组件实例会在销毁时自动清理
    console.log('Svelte app unmounted')
  }

  /**
   * 注册引擎到 Svelte
   * 
   * @param app - Svelte 应用实例
   * @param engine - 核心引擎实例
   */
  registerEngine(app: any, engine: CoreEngine): void {
    // 将引擎存储到 store 中,供组件使用
    this.engineStore.set(engine)

    // 将引擎添加到应用选项中
    if (!app.options.props) {
      app.options.props = {}
    }
    app.options.props.engine = engine

    // 将引擎注册到全局,供 getEngine() 使用
    ;(window as any).__ldesignEngine = engine
  }

  /**
   * 获取引擎 store
   * 
   * @returns 引擎 store
   */
  getEngineStore() {
    return this.engineStore
  }

  /**
   * 创建状态适配器
   * 
   * @returns 状态适配器实例
   */
  createStateAdapter(): StateAdapter {
    return new SvelteStateAdapter()
  }

  /**
   * 创建事件适配器
   * 
   * @returns 事件适配器实例
   */
  createEventAdapter(): EventAdapter {
    return new SvelteEventAdapter()
  }

  /**
   * 映射生命周期钩子
   * 
   * @returns 生命周期钩子映射
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'beforeMount',
      mounted: 'onMount',
      beforeUpdate: 'beforeUpdate',
      updated: 'afterUpdate',
      beforeUnmount: 'onDestroy',
      unmounted: 'onDestroy',
    }
  }

  /**
   * 注册组件
   * 
   * Svelte 不需要全局注册组件
   * 
   * @param app - Svelte 应用实例
   * @param name - 组件名称
   * @param component - 组件
   */
  registerComponent(app: any, name: string, component: any): void {
    console.log(`Svelte component registered: ${name}`)
  }

  /**
   * 注册指令
   * 
   * Svelte 使用 actions 而不是指令
   * 
   * @param app - Svelte 应用实例
   * @param name - 指令名称
   * @param directive - 指令
   */
  registerDirective(app: any, name: string, directive: any): void {
    console.log(`Svelte action registered: ${name}`)
  }

  /**
   * 提供全局属性
   * 
   * Svelte 通过 context 提供全局属性
   * 
   * @param app - Svelte 应用实例
   * @param key - 属性键
   * @param value - 属性值
   */
  provideGlobalProperty(app: any, key: string, value: any): void {
    if (!app.options.context) {
      app.options.context = new Map()
    }
    app.options.context.set(key, value)
  }
}

/**
 * 创建 Svelte 适配器
 * 
 * @returns Svelte 适配器实例
 */
export function createSvelteAdapter(): SvelteAdapter {
  return new SvelteAdapter()
}

