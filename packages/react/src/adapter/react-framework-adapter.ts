/**
 * React 框架适配器
 * 
 * 实现 FrameworkAdapter 接口,提供 React 特定的集成
 */

import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import type {
  CoreEngine,
  EventAdapter,
  EventHandler,
  FrameworkAdapter,
  FrameworkInfo,
  LifecycleHookMap,
  ReactiveState,
  StateAdapter,
  Unsubscribe,
} from '@ldesign/engine-core'
import { createElement } from 'react'

/**
 * React 框架信息
 */
export const REACT_FRAMEWORK_INFO: FrameworkInfo = {
  name: 'react',
  version: '18.x',
  features: {
    reactive: true,
    components: true,
    directives: false, // React 没有指令系统
    slots: true, // React 使用 children
  },
}

/**
 * React 状态适配器
 * 
 * 桥接 React 的状态系统和引擎的状态管理
 */
export class ReactStateAdapter implements StateAdapter {
  private listeners = new Map<string, Set<Function>>()

  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    let value = initialValue
    const listeners = new Set<Function>()

    return {
      get value() {
        return value
      },
      set value(newValue: T) {
        const oldValue = value
        value = newValue
        listeners.forEach(listener => listener(newValue, oldValue))
      },
      readonly(): Readonly<T> {
        return value as Readonly<T>
      },
      update(updater: (prev: T) => T) {
        this.value = updater(value)
      },
      reset() {
        this.value = initialValue
      },
    }
  }

  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let currentValue = getter()

    const checkUpdate = () => {
      const newValue = getter()
      if (newValue !== currentValue) {
        const oldValue = currentValue
        currentValue = newValue
        callback(newValue, oldValue)
      }
    }

    // 使用简单的轮询检查(在实际应用中可以使用更复杂的方案)
    const interval = setInterval(checkUpdate, 100)

    return () => {
      clearInterval(interval)
    }
  }

  batch(fn: () => void): void {
    // React 18 已经有自动批处理
    // 这里直接执行即可
    fn()
  }

  computed<T>(getter: () => T): ReactiveState<T> {
    const reactive = this.createReactiveState(getter())

    // 监听依赖变化并更新计算值
    this.watch(getter, (newValue) => {
      reactive.value = newValue
    })

    return reactive
  }
}

/**
 * React 事件适配器
 * 
 * 提供 React 特定的事件系统集成
 */
export class ReactEventAdapter implements EventAdapter {
  private events = new Map<string, Set<EventHandler>>()

  emit(event: string, payload?: any): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`[ReactEventAdapter] Error in handler for event "${event}":`, error)
        }
      })
    }
  }

  on(event: string, handler: EventHandler): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    this.events.get(event)!.add(handler)

    return () => {
      this.off(event, handler)
    }
  }

  once(event: string, handler: EventHandler): Unsubscribe {
    const wrappedHandler: EventHandler = (payload) => {
      handler(payload)
      this.off(event, wrappedHandler)
    }

    return this.on(event, wrappedHandler)
  }

  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      // 移除该事件的所有处理器
      this.events.delete(event)
      return
    }

    const handlers = this.events.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.events.delete(event)
      }
    }
  }
}

/**
 * React 框架适配器
 * 
 * 实现 FrameworkAdapter 接口
 */
export class ReactFrameworkAdapter implements FrameworkAdapter<Root, React.ComponentType, Element> {
  readonly info = REACT_FRAMEWORK_INFO

  private engineContext: CoreEngine | null = null

  /**
   * 创建 React 应用
   */
  createApp(rootComponent: React.ComponentType, options?: any): Root {
    // 获取或创建容器元素
    const container = options?.container || document.getElementById('root')
    if (!container) {
      throw new Error('[ReactFrameworkAdapter] Container element not found')
    }

    // 创建 React root
    const root = createRoot(container)

    return root
  }

  /**
   * 挂载应用
   */
  async mount(root: Root, mountElement: string | Element): Promise<void> {
    // React 18 的 root 已经绑定了容器
    // 这里只需要确保已经 render
    // 实际的 render 在 registerEngine 中处理
  }

  /**
   * 卸载应用
   */
  async unmount(root: Root): Promise<void> {
    root.unmount()
  }

  /**
   * 注册引擎到应用
   */
  registerEngine(root: Root, engine: CoreEngine): void {
    this.engineContext = engine

    // React 使用 Context 来提供引擎实例
    // 这里暂时保存引擎实例,在 EngineProvider 组件中使用
  }

  /**
   * 获取引擎上下文
   */
  getEngineContext(): CoreEngine | null {
    return this.engineContext
  }

  /**
   * 创建状态适配器
   */
  createStateAdapter(): StateAdapter {
    return new ReactStateAdapter()
  }

  /**
   * 创建事件适配器
   */
  createEventAdapter(): EventAdapter {
    return new ReactEventAdapter()
  }

  /**
   * 映射生命周期钩子
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'useEffect', // React 使用 useEffect 处理挂载
      mounted: 'useEffect',
      beforeUpdate: 'useEffect',
      updated: 'useEffect',
      beforeUnmount: 'useEffect', // cleanup 函数
      unmounted: 'useEffect',
    }
  }
}

/**
 * 创建 React 框架适配器实例
 */
export function createReactFrameworkAdapter(): ReactFrameworkAdapter {
  return new ReactFrameworkAdapter()
}
