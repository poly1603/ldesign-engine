/**
 * Preact 框架适配器
 * 
 * 支持 Preact 10.0+
 */

import { render, h } from 'preact'
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
 * Preact 框架信息
 */
const PREACT_INFO: FrameworkInfo = {
  name: 'preact',
  version: '10.0+',
  features: {
    reactive: true,
    components: true,
    directives: false,
    slots: true,
  },
}

/**
 * Preact 状态适配器
 */
class PreactStateAdapter implements StateAdapter {
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

    checkValue()

    return () => {
      // Preact 中的清理逻辑
    }
  }

  /**
   * 批量更新状态
   */
  batchUpdate(fn: () => void): void {
    fn()
  }
}

/**
 * Preact 事件适配器
 */
class PreactEventAdapter implements EventAdapter {
  /**
   * 监听事件
   */
  on(target: any, event: string, handler: (...args: any[]) => void): Unsubscribe {
    target.addEventListener(event, handler)
    return () => target.removeEventListener(event, handler)
  }

  /**
   * 触发事件
   */
  emit(target: any, event: string, detail?: any): void {
    target.dispatchEvent(new CustomEvent(event, { detail }))
  }

  /**
   * 一次性监听
   */
  once(target: any, event: string, handler: (...args: any[]) => void): Unsubscribe {
    const wrappedHandler = (...args: any[]) => {
      handler(...args)
      target.removeEventListener(event, wrappedHandler)
    }
    target.addEventListener(event, wrappedHandler)
    return () => target.removeEventListener(event, wrappedHandler)
  }
}

/**
 * Preact 框架适配器
 */
export class PreactAdapter implements FrameworkAdapter {
  private stateAdapter = new PreactStateAdapter()
  private eventAdapter = new PreactEventAdapter()
  private engine: CoreEngine | null = null
  private vnode: any = null

  /**
   * 获取框架信息
   */
  getFrameworkInfo(): FrameworkInfo {
    return PREACT_INFO
  }

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

    const { component, options } = app
    const props = options.props || {}

    // 使用 Preact render 挂载组件
    this.vnode = render(h(component, props), target)
  }

  /**
   * 卸载应用
   */
  async unmount(app: any, mountElement: string | Element): Promise<void> {
    const target = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (target) {
      render(null, target)
      this.vnode = null
    }
  }

  /**
   * 注册引擎
   */
  registerEngine(app: any, engine: CoreEngine): void {
    this.engine = engine

    // 将引擎透传给根组件,方便通过 props 访问
    const options = app.options || {}
    const props = {
      ...(options.props || {}),
      engine,
    }
    app.options = {
      ...options,
      props,
    }

    // 将引擎注入到全局作用域,便于调试和在非组件环境中访问
    const globalObject = window as Window & { __ldesignEngine?: CoreEngine }
    Reflect.set(globalObject as Record<string, unknown>, '__ldesignEngine', engine)
  }

  /**
   * 获取状态适配器
   */
  getStateAdapter(): StateAdapter {
    return this.stateAdapter
  }

  /**
   * 获取事件适配器
   */
  getEventAdapter(): EventAdapter {
    return this.eventAdapter
  }

  /**
   * 获取生命周期钩子
   */
  getLifecycleHooks(): LifecycleHookMap {
    return {
      beforeCreate: [],
      created: [],
      beforeMount: [],
      mounted: [],
      beforeUpdate: [],
      updated: [],
      beforeUnmount: [],
      unmounted: [],
    }
  }
}

/**
 * 创建 Preact 适配器
 */
export function createPreactAdapter(): PreactAdapter {
  return new PreactAdapter()
}

