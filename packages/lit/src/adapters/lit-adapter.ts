/**
 * Lit 框架适配器
 * 
 * 支持 Lit 3.0+
 */

import { LitElement, html } from 'lit'
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
 * Lit 框架信息
 */
const LIT_INFO: FrameworkInfo = {
  name: 'lit',
  version: '3.0+',
  features: {
    reactive: true,
    components: true,
    directives: true,
    slots: true,
  },
}

/**
 * Lit 状态适配器
 * 
 * 使用 Lit 的响应式属性系统
 */
class LitStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    let value = initialValue
    const initial = JSON.parse(JSON.stringify(initialValue))
    const listeners: Set<(value: T) => void> = new Set()

    return {
      get value() {
        return value
      },
      set value(newValue: T) {
        value = newValue
        listeners.forEach(listener => listener(value))
      },
      readonly() {
        return value
      },
      update(updater: (prev: T) => T) {
        value = updater(value)
        listeners.forEach(listener => listener(value))
      },
      reset() {
        value = JSON.parse(JSON.stringify(initial))
        listeners.forEach(listener => listener(value))
      },
    }
  }

  /**
   * 监听状态变化
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue: T | undefined
    let isFirst = true

    const checkValue = () => {
      const newValue = getter()
      if (!isFirst) {
        callback(newValue, oldValue)
      }
      oldValue = newValue
      isFirst = false
    }

    // 初始检查
    checkValue()

    // 返回取消监听函数
    return () => {
      // Lit 中的清理逻辑
    }
  }

  /**
   * 批量更新状态
   */
  batch(fn: () => void): void {
    fn()
  }

  /**
   * 创建计算属性
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    let cachedValue: T | undefined
    let hasValue = false
    const listeners: Set<(value: T) => void> = new Set()

    const update = () => {
      const newValue = getter()
      if (!hasValue || newValue !== cachedValue) {
        cachedValue = newValue
        hasValue = true
        listeners.forEach(listener => listener(cachedValue!))
      }
    }

    // 初始计算
    update()

    return {
      get value() {
        return cachedValue!
      },
      set value(_newValue: T) {
        console.warn('Cannot set computed property')
      },
      readonly() {
        return cachedValue!
      },
      update(_updater: (prev: T) => T) {
        console.warn('Cannot update computed property')
      },
      reset() {
        update()
      },
    }
  }
}

/**
 * Lit 事件适配器
 */
class LitEventAdapter implements EventAdapter {
  private handlers = new Map<string, Set<(payload: any) => void>>()

  /**
   * 触发事件
   */
  emit(event: string, payload?: any): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(payload))
    }
  }

  /**
   * 监听事件
   */
  on(event: string, handler: (payload: any) => void): Unsubscribe {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => this.off(event, handler)
  }

  /**
   * 一次性监听
   */
  once(event: string, handler: (payload: any) => void): Unsubscribe {
    const wrappedHandler = (payload: any) => {
      handler(payload)
      this.off(event, wrappedHandler)
    }
    return this.on(event, wrappedHandler)
  }

  /**
   * 移除监听
   */
  off(event: string, handler?: (payload: any) => void): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler)
    } else {
      this.handlers.delete(event)
    }
  }
}

/**
 * Lit 框架适配器
 */
export class LitAdapter implements FrameworkAdapter {
  readonly info: FrameworkInfo = LIT_INFO
  private stateAdapter = new LitStateAdapter()
  private eventAdapter = new LitEventAdapter()
  private engine: CoreEngine | null = null

  /**
   * 创建应用
   */
  createApp(rootComponent: any): any {
    return {
      component: rootComponent,
      options: {},
    }
  }

  /**
   * 挂载应用
   */
  async mount(app: any, mountElement: string | Element): Promise<void> {
    const target = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (!target) {
      throw new Error(`Mount element not found: ${mountElement}`)
    }

    const { component } = app
    
    // Lit 组件通过 @customElement 装饰器注册后，可以直接创建实例
    // 或者通过标签名创建（如果已知）
    // 直接创建实例是最可靠的方式，因为装饰器已经处理了注册
    const element = new component()
    target.appendChild(element)
  }

  /**
   * 卸载应用
   */
  async unmount(app: any): Promise<void> {
    // Lit 组件卸载由浏览器自动处理
  }

  /**
   * 注册引擎
   * 
   * 将引擎实例保存到适配器，并注入到全局作用域供组件访问
   */
  registerEngine(app: any, engine: CoreEngine): void {
    if (!engine || typeof engine !== 'object') {
      throw new Error(`Invalid engine: expected CoreEngine object, got ${typeof engine}`)
    }
    this.engine = engine
    // 将引擎注入到全局作用域，以便组件访问
    const globalWindow = window as any
    globalWindow.__ldesignEngine = engine
  }

  /**
   * 创建状态适配器
   */
  createStateAdapter(): StateAdapter {
    return this.stateAdapter
  }

  /**
   * 创建事件适配器
   */
  createEventAdapter(): EventAdapter {
    return this.eventAdapter
  }

  /**
   * 映射生命周期钩子
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'beforeMount',
      mounted: 'connectedCallback',
      beforeUpdate: 'willUpdate',
      updated: 'updated',
      beforeUnmount: 'disconnectedCallback',
      unmounted: 'disconnectedCallback',
    }
  }
}

/**
 * 创建 Lit 适配器
 */
export function createLitAdapter(): LitAdapter {
  return new LitAdapter()
}

