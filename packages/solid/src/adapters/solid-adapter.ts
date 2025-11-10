/**
 * Solid.js 框架适配器
 *
 * 支持 Solid.js 1.8+
 */

import { createSignal, createEffect, createMemo, onCleanup } from 'solid-js'
import { render } from 'solid-js/web'
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
import { EngineContext } from '../signals'


/**
 * Solid.js 框架信息
 */
const SOLID_INFO: FrameworkInfo = {
  name: 'solid',
  version: '1.8+',
  features: {
    reactive: true,
    components: true,
    directives: true,
    slots: false,
  },
}

/**
 * Solid 状态适配器
 *
 * 使用 Solid signals 实现响应式状态管理
 */
class SolidStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   *
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    const [get, set] = createSignal(initialValue)
    const initial = JSON.parse(JSON.stringify(initialValue))

    return {
      get value() {
        return get()
      },
      set value(newValue: T) {
        set(() => newValue)
      },
      readonly() {
        return get()
      },
      update(updater: (prev: T) => T) {
        set(updater)
      },
      reset() {
        set(() => JSON.parse(JSON.stringify(initial)))
      },
      // 暴露 Solid signal 以便在组件中使用
      signal: [get, set],
    } as ReactiveState<T> & { signal: [() => T, (value: T | ((prev: T) => T)) => void] }
  }

  /**
   * 监听状态变化
   *
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调函数
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue: T | undefined
    let isFirst = true

    const dispose = createEffect(() => {
      const value = getter()
      if (!isFirst) {
        callback(value, oldValue)
      }
      oldValue = value
      isFirst = false
    })

    return dispose
  }

  /**
   * 批量更新状态
   *
   * Solid 自动批量更新,所以直接执行函数即可
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
    const memo = createMemo(getter)

    return {
      get value() {
        return memo()
      },
      set value(_newValue: T) {
        console.warn('Cannot set computed property')
      },
      readonly() {
        return memo()
      },
      update(_updater: (prev: T) => T) {
        console.warn('Cannot update computed property')
      },
      // 暴露 Solid memo
      memo,
    } as ReactiveState<T> & { memo: () => T }
  }
}

/**
 * Solid 事件适配器
 *
 * 使用简单的发布订阅模式实现事件系统
 */
class SolidEventAdapter implements EventAdapter {
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
 * Solid 框架适配器
 */
export class SolidAdapter implements FrameworkAdapter<any, any> {
  readonly info = SOLID_INFO
  private engineSignal = createSignal<CoreEngine | null>(null)
  private disposeApp: (() => void) | null = null

  /**
   * 创建 Solid 应用
   *
   * @param rootComponent - 根组件
   * @param options - 应用选项
   * @returns Solid 应用实例
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
   * @param app - Solid 应用实例
   * @param mountElement - 挂载元素
   */
  async mount(app: any, mountElement: string | Element): Promise<void> {
    const target = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (!target) {
      throw new Error(`Mount element not found: ${mountElement}`)
    }

    // 使用 Solid 的 render 函数挂载组件，并通过上下文提供引擎实例
    const [getEngine] = this.engineSignal
    this.disposeApp = render(
      () =>
        EngineContext.Provider({
          value: (getEngine() as CoreEngine)!,
          get children() {
            return app.component(app.options.props || {})
          },
        }) as any,
      target
    )
  }

  /**
   * 卸载应用
   *
   * @param app - Solid 应用实例
   */
  async unmount(app: any): Promise<void> {
    if (this.disposeApp) {
      this.disposeApp()
      this.disposeApp = null
    }
    console.log('Solid app unmounted')
  }

  /**
   * 注册引擎到 Solid
   *
   * @param app - Solid 应用实例
   * @param engine - 核心引擎实例
   */
  registerEngine(app: any, engine: CoreEngine): void {
    // 将引擎存储到 signal 中
    const [, setEngine] = this.engineSignal
    setEngine(() => engine)

    // 将引擎添加到应用选项中
    if (!app.options.props) {
      app.options.props = {}
    }
    app.options.props.engine = engine
  }

  /**
   * 获取引擎 signal
   *
   * @returns 引擎 signal
   */
  getEngineSignal() {
    return this.engineSignal
  }

  /**
   * 创建状态适配器
   *
   * @returns 状态适配器实例
   */
  createStateAdapter(): StateAdapter {
    return new SolidStateAdapter()
  }

  /**
   * 创建事件适配器
   *
   * @returns 事件适配器实例
   */
  createEventAdapter(): EventAdapter {
    return new SolidEventAdapter()
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
      updated: 'onCleanup',
      beforeUnmount: 'onCleanup',
      unmounted: 'onCleanup',
    }
  }

  /**
   * 注册组件
   *
   * Solid 不需要全局注册组件
   *
   * @param app - Solid 应用实例
   * @param name - 组件名称
   * @param component - 组件
   */
  registerComponent(app: any, name: string, component: any): void {
    console.log(`Solid component registered: ${name}`)
  }

  /**
   * 注册指令
   *
   * Solid 使用 directives
   *
   * @param app - Solid 应用实例
   * @param name - 指令名称
   * @param directive - 指令
   */
  registerDirective(app: any, name: string, directive: any): void {
    console.log(`Solid directive registered: ${name}`)
  }

  /**
   * 提供全局属性
   *
   * Solid 通过 context 提供全局属性
   *
   * @param app - Solid 应用实例
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
 * 创建 Solid 适配器
 *
 * @returns Solid 适配器实例
 */
export function createSolidAdapter(): SolidAdapter {
  return new SolidAdapter()
}

