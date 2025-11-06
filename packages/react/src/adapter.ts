/**
 * React 框架适配器
 * 
 * 提供 React 框架与核心引擎的集成,包括:
 * - React 应用创建和挂载
 * - 状态管理适配(使用 React hooks)
 * - 事件系统适配
 * - 生命周期映射
 * 
 * @module adapter
 */

import { createElement, type ComponentType, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
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
import { EngineProvider } from './hooks.tsx'

/**
 * React 框架信息
 */
const REACT_INFO: FrameworkInfo = {
  name: 'react',
  version: '18.x',
  features: {
    reactive: true,
    components: true,
    directives: false,
    slots: true,
  },
}

/**
 * React 状态适配器
 * 
 * 将核心引擎的状态管理适配到 React 的 hooks 系统
 * 
 * 注意: React 的响应式系统基于 hooks,与 Vue 的响应式系统不同
 * 这里提供的是一个简化的适配层,实际使用时建议配合 React hooks
 */
export class ReactStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   * 
   * 注意: 在 React 中,响应式状态应该使用 useState hook
   * 这里提供的是一个兼容层
   * 
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    let currentValue = initialValue
    const listeners = new Set<(value: T) => void>()

    return {
      get value() {
        return currentValue
      },
      set value(newValue: T) {
        if (currentValue !== newValue) {
          currentValue = newValue
          listeners.forEach(listener => listener(newValue))
        }
      },
      readonly() {
        return currentValue
      },
      update(updater: (prev: T) => T) {
        this.value = updater(currentValue)
      },
      reset() {
        this.value = initialValue
      },
    }
  }

  /**
   * 监听状态变化
   * 
   * @param getter - 获取状态的函数
   * @param callback - 状态变化回调
   * @returns 取消监听函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue = getter()
    
    // 使用轮询检测变化(简化实现)
    // 实际使用时建议使用 React 的 useEffect
    const timer = setInterval(() => {
      const newValue = getter()
      if (newValue !== oldValue) {
        callback(newValue, oldValue)
        oldValue = newValue
      }
    }, 100)

    return () => clearInterval(timer)
  }

  /**
   * 批量更新
   * 
   * React 18+ 自动批量更新,这里直接执行即可
   * 
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    fn()
  }

  /**
   * 计算属性
   * 
   * @param getter - 计算函数
   * @returns 响应式状态对象
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    const state = this.createReactiveState(getter())
    
    // 简化实现: 实际使用时建议使用 useMemo
    setInterval(() => {
      state.value = getter()
    }, 100)

    return state
  }
}

/**
 * React 事件适配器
 * 
 * 提供与核心引擎事件系统兼容的事件接口
 */
export class ReactEventAdapter implements EventAdapter {
  private handlers = new Map<string, Set<(payload: any) => void>>()

  /**
   * 触发事件
   * 
   * @param event - 事件名称
   * @param payload - 事件数据
   */
  emit(event: string, payload?: any): void {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Error in React event handler for "${event}":`, error)
        }
      })
    }
  }

  /**
   * 监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数
   * @returns 取消监听函数
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
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数
   * @returns 取消监听函数
   */
  once(event: string, handler: (payload: any) => void): Unsubscribe {
    const wrappedHandler = (payload: any) => {
      handler(payload)
      this.off(event, wrappedHandler)
    }
    return this.on(event, wrappedHandler)
  }

  /**
   * 移除事件监听
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数
   */
  off(event: string, handler?: (payload: any) => void): void {
    if (!handler) {
      this.handlers.delete(event)
    } else {
      this.handlers.get(event)?.delete(handler)
    }
  }
}

/**
 * React 框架适配器
 * 
 * 提供 React 应用的创建、挂载和引擎集成
 * 
 * @example
 * ```typescript
 * const adapter = new ReactAdapter()
 * const root = adapter.createApp(App)
 * await adapter.mount(root, '#app')
 * ```
 */
export class ReactAdapter implements FrameworkAdapter<Root, ComponentType> {
  readonly info = REACT_INFO
  
  /** 存储引擎实例的 Map,用于在组件中访问 */
  private engineMap = new WeakMap<Root, CoreEngine>()

  /**
   * 创建 React 应用
   * 
   * @param rootComponent - 根组件
   * @param options - 创建选项
   * @returns React Root 实例
   */
  createApp(rootComponent: ComponentType, options?: any): Root {
    // 注意: 实际的 Root 创建在 mount 时进行
    // 这里返回一个占位对象
    return { rootComponent, options } as any
  }

  /**
   * 挂载应用
   *
   * @param app - React Root 实例
   * @param mountElement - 挂载元素
   */
  async mount(app: Root, mountElement: string | Element): Promise<void> {
    const container = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (!container) {
      throw new Error(`Mount element not found: ${mountElement}`)
    }

    // 创建 React Root
    const root = createRoot(container)

    // 获取根组件和选项
    const { rootComponent, options } = app as any

    // 获取引擎实例
    const engine = this.engineMap.get(app)

    if (!engine) {
      throw new Error('Engine not registered. Call registerEngine before mount.')
    }

    // 渲染应用 - 用 EngineProvider 包裹
    const element = createElement(
      EngineProvider,
      { engine },
      createElement(rootComponent, options)
    )
    root.render(element)

    // 保存 root 引用
    Object.assign(app, root)
  }

  /**
   * 卸载应用
   * 
   * @param app - React Root 实例
   */
  async unmount(app: Root): Promise<void> {
    app.unmount()
  }

  /**
   * 注册引擎到应用
   * 
   * 在 React 中,引擎通过 Context 提供给组件
   * 
   * @param app - React Root 实例
   * @param engine - 核心引擎实例
   */
  registerEngine(app: Root, engine: CoreEngine): void {
    this.engineMap.set(app, engine)
  }

  /**
   * 创建状态适配器
   * 
   * @returns 状态适配器实例
   */
  createStateAdapter(): StateAdapter {
    return new ReactStateAdapter()
  }

  /**
   * 创建事件适配器
   * 
   * @returns 事件适配器实例
   */
  createEventAdapter(): EventAdapter {
    return new ReactEventAdapter()
  }

  /**
   * 映射生命周期钩子
   * 
   * React 的生命周期与 Vue 不同,这里提供一个映射
   * 
   * @returns 生命周期钩子映射
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'useEffect-setup',
      mounted: 'useEffect-mounted',
      beforeUpdate: 'useEffect-before-update',
      updated: 'useEffect-updated',
      beforeUnmount: 'useEffect-cleanup',
      unmounted: 'useEffect-unmounted',
    }
  }
}

/**
 * 创建 React 适配器实例
 * 
 * @returns React 适配器实例
 * 
 * @example
 * ```typescript
 * import { createReactAdapter } from '@ldesign/engine-react'
 * 
 * const adapter = createReactAdapter()
 * ```
 */
export function createReactAdapter(): ReactAdapter {
  return new ReactAdapter()
}

