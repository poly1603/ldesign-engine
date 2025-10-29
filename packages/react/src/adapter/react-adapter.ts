/**
 * React 框架适配器实现
 * 
 * 将引擎核心功能适配到 React 生态系统
 * 
 * @module adapter/react-adapter
 */

import type { ComponentType } from 'react'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type {
  FrameworkAdapter,
  FrameworkInfo,
  LifecycleHookMap,
  StateAdapter,
  EventAdapter,
  CoreEngine,
} from '@ldesign/engine-core'
import { ReactStateAdapter } from './react-state-adapter'
import { ReactEventAdapter } from './react-event-adapter'

/**
 * React 框架适配器
 * 
 * 实现 FrameworkAdapter 接口,提供 React 特定的集成功能
 */
export class ReactFrameworkAdapter implements FrameworkAdapter<Root, ComponentType, Element> {
  readonly info: FrameworkInfo = {
    name: 'react',
    version: '18.0.0',
    features: {
      reactive: true,
      components: true,
      directives: false,
      slots: true,
    },
  }

  private roots = new WeakMap<Root, HTMLElement>()

  /**
   * 创建 React 应用
   * 
   * @param rootComponent - 根组件
   * @param options - 创建选项
   * @returns Root 实例
   */
  createApp(rootComponent: ComponentType, options?: any): Root {
    // React 18+ 使用 createRoot
    const container = document.createElement('div')
    const root = createRoot(container, options)
    
    // 保存容器引用
    this.roots.set(root, container)
    
    return root
  }

  /**
   * 挂载应用
   * 
   * @param root - Root 实例
   * @param mountElement - 挂载元素
   */
  async mount(root: Root, mountElement: string | Element): Promise<void> {
    const container = this.roots.get(root)
    if (!container) {
      throw new Error('Root container not found')
    }

    const target = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (!target) {
      throw new Error(`Mount element not found: ${mountElement}`)
    }

    // 将容器添加到目标元素
    target.appendChild(container)
  }

  /**
   * 卸载应用
   * 
   * @param root - Root 实例
   */
  async unmount(root: Root): Promise<void> {
    const container = this.roots.get(root)
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
    
    root.unmount()
    this.roots.delete(root)
  }

  /**
   * 注册引擎到应用
   * 
   * React 使用 Context 提供引擎实例,在组件层面处理
   * 
   * @param root - Root 实例
   * @param engine - 引擎实例
   */
  registerEngine(root: Root, engine: CoreEngine): void {
    // React 的引擎注册在 EngineProvider 组件中处理
    // 这里可以存储引擎引用供后续使用
    (root as any).__engine__ = engine
  }

  /**
   * 创建状态适配器
   * 
   * @returns React 状态适配器
   */
  createStateAdapter(): StateAdapter {
    return new ReactStateAdapter()
  }

  /**
   * 创建事件适配器
   * 
   * @returns React 事件适配器
   */
  createEventAdapter(): EventAdapter {
    return new ReactEventAdapter()
  }

  /**
   * 映射生命周期钩子
   * 
   * @returns 生命周期钩子映射
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'componentWillMount',
      mounted: 'componentDidMount',
      beforeUpdate: 'componentWillUpdate',
      updated: 'componentDidUpdate',
      beforeUnmount: 'componentWillUnmount',
      unmounted: 'componentDidUnmount',
    }
  }

  /**
   * 获取应用实例
   * 
   * @param root - Root 实例
   * @returns 内部容器元素
   */
  getAppInstance(root: Root): HTMLElement | undefined {
    return this.roots.get(root)
  }

  /**
   * 提供全局属性
   * 
   * React 不支持全局属性,使用 Context 代替
   * 
   * @param root - Root 实例
   * @param key - 属性键
   * @param value - 属性值
   */
  provideGlobalProperty(root: Root, key: string, value: any): void {
    // React 使用 Context 提供全局数据
    // 这里可以存储到 root 实例上
    (root as any)[`__global_${key}__`] = value
  }
}

/**
 * 创建 React 框架适配器
 * 
 * @returns React 适配器实例
 */
export function createReactAdapter(): ReactFrameworkAdapter {
  return new ReactFrameworkAdapter()
}

